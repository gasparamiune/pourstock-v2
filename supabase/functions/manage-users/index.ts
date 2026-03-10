import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ========== INPUT VALIDATION ==========
const VALID_ROLES = ["hotel_admin", "manager", "staff"];
const VALID_DEPARTMENTS = ["reception", "housekeeping", "restaurant"];
const VALID_DEPT_ROLES = ["manager", "receptionist", "hk_worker", "staff"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: unknown): string | null {
  if (typeof email !== "string" || !EMAIL_REGEX.test(email) || email.length > 255) return null;
  return email.trim().toLowerCase();
}

function validateString(val: unknown, maxLen = 200): string | null {
  if (typeof val !== "string" || val.trim().length === 0 || val.length > maxLen) return null;
  return val.trim();
}

// ========== PHASE 1 MIRROR HELPER ==========
// Best-effort write to Phase 1 foundation tables.
// NEVER blocks or fails the primary production flow.
// Primary source of truth: hotel_members.hotel_role + user_roles
// Mirror target: membership_roles (read by nothing yet — future Phase 3)
async function mirrorMembershipRole(
  supabaseAdmin: any,
  membershipId: string,
  role: string,
  grantedBy: string,
  context: string,
) {
  try {
    // Clear existing roles for this membership then insert the current one.
    // This keeps membership_roles as a 1:1 mirror of hotel_members.hotel_role.
    // Phase 1 constraint: single-role mirror only. Multi-role comes later.
    await supabaseAdmin.from("membership_roles").delete().eq("membership_id", membershipId);
    await supabaseAdmin.from("membership_roles").upsert(
      { membership_id: membershipId, role, granted_by: grantedBy },
      { onConflict: "membership_id,role" },
    );
  } catch (err) {
    // Best-effort: log and continue. Production flow is NOT affected.
    console.error(`[Phase1Mirror] membership_roles mirror failed (${context}):`, err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // ========== AUTH CHECK ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const callerId = claimsData.claims.sub as string;

    const { action, hotelId, ...params } = await req.json();

    // Validate hotelId is provided
    if (!hotelId || typeof hotelId !== "string") {
      return jsonResponse({ error: "hotelId is required" }, 400);
    }

    // ========== VERIFY CALLER MEMBERSHIP ==========
    const { data: callerMembership } = await supabaseAdmin
      .from("hotel_members")
      .select("hotel_role, is_approved")
      .eq("user_id", callerId)
      .eq("hotel_id", hotelId)
      .eq("is_approved", true)
      .single();

    if (!callerMembership) {
      return jsonResponse({ error: "Not a member of this hotel" }, 403);
    }

    const callerIsAdmin = callerMembership.hotel_role === "hotel_admin";
    const callerIsManager = callerMembership.hotel_role === "manager";

    if (!callerIsAdmin && !callerIsManager) {
      return jsonResponse({ error: "Insufficient permissions" }, 403);
    }

    // Helper: check if target user is hotel_admin in this hotel
    async function isTargetHotelAdmin(userId: string): Promise<boolean> {
      const { data } = await supabaseAdmin
        .from("hotel_members")
        .select("hotel_role")
        .eq("user_id", userId)
        .eq("hotel_id", hotelId)
        .eq("hotel_role", "hotel_admin");
      return (data || []).length > 0;
    }

    // Helper: audit log
    async function auditLog(logAction: string, targetType: string, targetId: string, details: any = {}) {
      await supabaseAdmin.from("audit_logs").insert({
        hotel_id: hotelId,
        user_id: callerId,
        action: logAction,
        target_type: targetType,
        target_id: targetId,
        details,
      });
    }

    switch (action) {
      // ─────────────────────────────────────────────
      // createUser
      // PRIMARY WRITES: auth.users, profiles, hotel_members, user_roles, user_departments
      // MIRRORED WRITE: membership_roles (best-effort)
      // ─────────────────────────────────────────────
      case "createUser": {
        const email = validateEmail(params.email);
        if (!email) return jsonResponse({ error: "Invalid email" }, 400);

        const fullName = validateString(params.fullName);
        if (!fullName) return jsonResponse({ error: "Invalid name" }, 400);

        const password = params.password;
        if (typeof password !== "string" || password.length < 8 || password.length > 128) {
          return jsonResponse({ error: "Password must be 8-128 characters" }, 400);
        }

        const role = params.role || "staff";
        if (!VALID_ROLES.includes(role)) {
          return jsonResponse({ error: `Invalid role. Must be: ${VALID_ROLES.join(", ")}` }, 400);
        }

        if (role === "hotel_admin" && !callerIsAdmin) {
          return jsonResponse({ error: "Only hotel admins can assign the hotel_admin role" }, 403);
        }

        const phone = params.phone ? validateString(params.phone, 30) : null;

        // PRIMARY: Create auth user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

        if (createError) return jsonResponse({ error: createError.message }, 400);

        // PRIMARY: Update profile
        await supabaseAdmin
          .from("profiles")
          .update({ phone_number: phone, is_approved: true, full_name: fullName })
          .eq("user_id", newUser.user.id);

        // PRIMARY: Create hotel membership
        const { data: membership } = await supabaseAdmin.from("hotel_members").upsert(
          { hotel_id: hotelId, user_id: newUser.user.id, hotel_role: role, is_approved: true },
          { onConflict: "hotel_id,user_id" }
        ).select("id").single();

        // MIRROR (best-effort): membership_roles
        if (membership) {
          await mirrorMembershipRole(supabaseAdmin, membership.id, role, callerId, `createUser:${newUser.user.id}`);
        }

        // PRIMARY: Legacy user_roles (backward compat)
        const legacyRole = role === "hotel_admin" ? "admin" : role;
        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: newUser.user.id, role: legacyRole }, { onConflict: "user_id,role" });

        // PRIMARY: Assign departments
        if (params.departments && Array.isArray(params.departments)) {
          for (const dept of params.departments) {
            if (!VALID_DEPARTMENTS.includes(dept.department)) continue;
            const deptRole = VALID_DEPT_ROLES.includes(dept.department_role) ? dept.department_role : "staff";
            await supabaseAdmin.from("user_departments").upsert(
              { user_id: newUser.user.id, hotel_id: hotelId, department: dept.department, department_role: deptRole },
              { onConflict: "user_id,hotel_id,department" }
            );
          }
        }

        await auditLog("user.create", "user", newUser.user.id, { email, role, fullName });
        return jsonResponse({ success: true, userId: newUser.user.id });
      }

      case "deleteUser": {
        const { userId } = params;
        if (!userId || typeof userId !== "string") return jsonResponse({ error: "userId required" }, 400);

        if (!callerIsAdmin && await isTargetHotelAdmin(userId)) {
          return jsonResponse({ error: "Managers cannot delete hotel admin users" }, 403);
        }
        if (userId === callerId) {
          return jsonResponse({ error: "Cannot delete your own account" }, 400);
        }

        // Note: membership_roles rows are cleaned up automatically via ON DELETE CASCADE
        // from hotel_members → membership_roles foreign key.
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) return jsonResponse({ error: deleteError.message }, 400);

        await auditLog("user.delete", "user", userId);
        return jsonResponse({ success: true });
      }

      case "resetPassword": {
        const email = validateEmail(params.email);
        if (!email) return jsonResponse({ error: "Invalid email" }, 400);

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email });
        if (error) return jsonResponse({ error: error.message }, 400);

        await auditLog("user.reset_password", "user", email);
        return jsonResponse({ success: true, link: data.properties?.action_link });
      }

      case "approveUser": {
        const { userId, approved } = params;
        if (!userId || typeof userId !== "string") return jsonResponse({ error: "userId required" }, 400);
        if (typeof approved !== "boolean") return jsonResponse({ error: "approved must be boolean" }, 400);

        // PRIMARY: Update both profiles and hotel_members
        await supabaseAdmin.from("profiles").update({ is_approved: approved }).eq("user_id", userId);
        await supabaseAdmin
          .from("hotel_members")
          .update({ is_approved: approved })
          .eq("user_id", userId)
          .eq("hotel_id", hotelId);

        await auditLog(approved ? "user.approve" : "user.deny", "user", userId);
        return jsonResponse({ success: true });
      }

      // ─────────────────────────────────────────────
      // updateRole
      // PRIMARY WRITES: hotel_members.hotel_role, user_roles
      // MIRRORED WRITE: membership_roles (best-effort)
      // ─────────────────────────────────────────────
      case "updateRole": {
        const { userId, role } = params;
        if (!userId || typeof userId !== "string") return jsonResponse({ error: "userId required" }, 400);
        if (!VALID_ROLES.includes(role)) {
          return jsonResponse({ error: `Invalid role. Must be: ${VALID_ROLES.join(", ")}` }, 400);
        }

        if (role === "hotel_admin" && !callerIsAdmin) {
          return jsonResponse({ error: "Only hotel admins can assign the hotel_admin role" }, 403);
        }
        if (!callerIsAdmin && await isTargetHotelAdmin(userId)) {
          return jsonResponse({ error: "Managers cannot modify hotel admin users" }, 403);
        }

        // PRIMARY: Update hotel_members role (source of truth for hotel-scoped role)
        const { data: updatedMembership } = await supabaseAdmin
          .from("hotel_members")
          .update({ hotel_role: role })
          .eq("user_id", userId)
          .eq("hotel_id", hotelId)
          .select("id")
          .single();

        // MIRROR (best-effort): membership_roles
        if (updatedMembership) {
          await mirrorMembershipRole(supabaseAdmin, updatedMembership.id, role, callerId, `updateRole:${userId}`);
        }

        // PRIMARY: Legacy user_roles (source of truth for global is_admin/is_manager_or_admin)
        const legacyRole = role === "hotel_admin" ? "admin" : role;
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
        await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: legacyRole });

        await auditLog("role.change", "user", userId, { new_role: role });
        return jsonResponse({ success: true });
      }

      case "assignDepartment": {
        const { userId, department, departmentRole } = params;
        if (!userId || typeof userId !== "string") return jsonResponse({ error: "userId required" }, 400);
        if (!VALID_DEPARTMENTS.includes(department)) {
          return jsonResponse({ error: `Invalid department. Must be: ${VALID_DEPARTMENTS.join(", ")}` }, 400);
        }
        const deptRole = VALID_DEPT_ROLES.includes(departmentRole) ? departmentRole : "staff";

        if (!callerIsAdmin && await isTargetHotelAdmin(userId)) {
          return jsonResponse({ error: "Managers cannot modify hotel admin users" }, 403);
        }

        await supabaseAdmin.from("user_departments").upsert(
          { user_id: userId, hotel_id: hotelId, department, department_role: deptRole },
          { onConflict: "user_id,hotel_id,department" }
        );

        await auditLog("department.assign", "user", userId, { department, department_role: deptRole });
        return jsonResponse({ success: true });
      }

      case "removeDepartment": {
        const { userId, department } = params;
        if (!userId || typeof userId !== "string") return jsonResponse({ error: "userId required" }, 400);
        if (!VALID_DEPARTMENTS.includes(department)) {
          return jsonResponse({ error: `Invalid department` }, 400);
        }

        if (!callerIsAdmin && await isTargetHotelAdmin(userId)) {
          return jsonResponse({ error: "Managers cannot modify hotel admin users" }, 403);
        }

        await supabaseAdmin.from("user_departments").delete().eq("user_id", userId).eq("hotel_id", hotelId).eq("department", department);

        await auditLog("department.remove", "user", userId, { department });
        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    console.error("manage-users error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
