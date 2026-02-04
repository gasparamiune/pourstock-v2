/**
 * Error handler utility to prevent database error message exposure
 * Maps raw database errors to user-friendly messages
 */

export function getUserFriendlyError(error: unknown): string {
  const message = (error as { message?: string })?.message?.toLowerCase() || '';
  
  // Row Level Security violations
  if (message.includes('row-level security') || message.includes('rls')) {
    return 'You do not have permission to perform this action.';
  }
  
  // Duplicate key / unique constraint violations
  if (message.includes('duplicate key') || message.includes('already exists') || message.includes('unique constraint')) {
    return 'This record already exists.';
  }
  
  // Foreign key violations
  if (message.includes('foreign key') || message.includes('violates foreign key')) {
    return 'Cannot perform this action due to related records.';
  }
  
  // Not null violations
  if (message.includes('not null') || message.includes('null value') || message.includes('required')) {
    return 'Required information is missing.';
  }
  
  // Check constraint violations
  if (message.includes('violates check') || message.includes('check constraint')) {
    return 'Invalid data provided.';
  }
  
  // Invalid input
  if (message.includes('invalid input') || message.includes('invalid')) {
    return 'Invalid data provided.';
  }
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'Connection error. Please check your internet and try again.';
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'The request timed out. Please try again.';
  }
  
  // Authentication errors
  if (message.includes('jwt') || message.includes('token') || message.includes('unauthorized') || message.includes('not authenticated')) {
    return 'Your session has expired. Please sign in again.';
  }
  
  // Log full error in development for debugging
  if (import.meta.env.DEV) {
    console.error('Database error:', error);
  }
  
  // Generic fallback
  return 'An error occurred. Please try again or contact support.';
}
