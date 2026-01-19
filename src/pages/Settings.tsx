import { useState } from 'react';
import { 
  MapPin, 
  Users, 
  Link, 
  Bell, 
  Shield, 
  Database,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { mockLocations, mockUser } from '@/data/mockData';
import { cn } from '@/lib/utils';

type SettingsSection = 'locations' | 'users' | 'pos' | 'notifications';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('locations');

  const sections: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'pos', label: 'POS Integration', icon: Link },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Configure your inventory system</p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left touch-target",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="glass-card rounded-2xl p-6">
          {activeSection === 'locations' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-semibold text-lg">Locations</h2>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Location
                </Button>
              </div>
              
              <div className="space-y-3">
                {mockLocations.map((location) => (
                  <div 
                    key={location.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        location.isActive ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{location.name}</h3>
                        {location.description && (
                          <p className="text-sm text-muted-foreground">{location.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={location.isActive} />
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-semibold text-lg">Users & Roles</h2>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Invite User
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {mockUser.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{mockUser.name}</h3>
                      <p className="text-sm text-muted-foreground">{mockUser.email}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium capitalize">
                    {mockUser.role}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Role Permissions</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li><strong>Admin:</strong> Full access to all features</li>
                      <li><strong>Manager:</strong> Inventory, orders, reports, cannot manage users</li>
                      <li><strong>Staff:</strong> Quick count and receiving only</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'pos' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-semibold text-lg">POS Integration</h2>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    <div>
                      <h3 className="font-medium">Connected to POS</h3>
                      <p className="text-sm text-muted-foreground">Demo POS System</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Product Mapping</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Map your POS items to inventory products for automatic stock updates.
                  </p>
                  <Button variant="outline">Configure Mapping</Button>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Serving Sizes</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set standard pour sizes for accurate depletion tracking.
                  </p>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <span className="text-sm">Wine (glass)</span>
                      <span className="text-sm font-medium">150ml</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <span className="text-sm">Spirit (shot)</span>
                      <span className="text-sm font-medium">40ml</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <span className="text-sm">Beer (pint)</span>
                      <span className="text-sm font-medium">473ml</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-6">Notifications</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div>
                    <h3 className="font-medium">Low Stock Alerts</h3>
                    <p className="text-sm text-muted-foreground">Get notified when items hit reorder threshold</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div>
                    <h3 className="font-medium">Variance Alerts</h3>
                    <p className="text-sm text-muted-foreground">Notify when variance exceeds 10%</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div>
                    <h3 className="font-medium">Order Reminders</h3>
                    <p className="text-sm text-muted-foreground">Weekly reminder to review suggested orders</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div>
                    <h3 className="font-medium">Count Reminders</h3>
                    <p className="text-sm text-muted-foreground">Remind to count inventory weekly</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
