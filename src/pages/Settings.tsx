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
import { useLanguage } from '@/contexts/LanguageContext';
import { useHotelSettings } from '@/hooks/useHotelSettings';
import { cn } from '@/lib/utils';

type SettingsSection = 'locations' | 'users' | 'pos' | 'notifications' | 'tablePlan' | 'dataProtection';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('locations');
  const { t } = useLanguage();
  const { getSetting, updateSetting } = useHotelSettings();

  const autoSave = getSetting('auto_save_table_plan', true);
  const dataRetentionDays = getSetting('data_retention_days', 365);

  const sections: { id: SettingsSection; labelKey: string; icon: React.ElementType }[] = [
    { id: 'locations', labelKey: 'settings.locations', icon: MapPin },
    { id: 'users', labelKey: 'settings.usersRoles', icon: Users },
    { id: 'pos', labelKey: 'settings.spectraPOS', icon: Link },
    { id: 'notifications', labelKey: 'settings.notifications', icon: Bell },
    { id: 'tablePlan', labelKey: 'settings.tablePlan', icon: Database },
    { id: 'dataProtection', labelKey: 'Data Protection', icon: Shield },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
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
                {section.labelKey.startsWith('settings.') ? t(section.labelKey) : section.labelKey}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="glass-card rounded-2xl p-6">
          {activeSection === 'locations' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-semibold text-lg">{t('settings.locations')}</h2>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('settings.addLocation')}
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
                <h2 className="font-display font-semibold text-lg">{t('settings.usersRoles')}</h2>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('settings.inviteUser')}
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
                    <h4 className="font-medium text-sm">{t('settings.rolePermissions')}</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li><strong>Admin:</strong> {t('settings.adminDesc')}</li>
                      <li><strong>Manager:</strong> {t('settings.managerDesc')}</li>
                      <li><strong>Staff:</strong> {t('settings.staffDesc')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'pos' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-semibold text-lg">{t('settings.posIntegration')}</h2>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    <div>
                      <h3 className="font-medium">{t('settings.connectedTo')}</h3>
                      <p className="text-sm text-muted-foreground">{t('settings.posSystem')}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">{t('settings.productMapping')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('settings.productMappingDesc')}
                  </p>
                  <Button variant="outline">{t('settings.configureMapping')}</Button>
                </div>

                <div>
                  <h3 className="font-medium mb-3">{t('settings.servingSizes')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('settings.servingSizesDesc')}
                  </p>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <span className="text-sm">{t('settings.wineGlass')}</span>
                      <span className="text-sm font-medium">150ml</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <span className="text-sm">{t('settings.spiritShot')}</span>
                      <span className="text-sm font-medium">40ml</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <span className="text-sm">{t('settings.beerPint')}</span>
                      <span className="text-sm font-medium">473ml</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-6">{t('settings.notifications')}</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div>
                    <h3 className="font-medium">{t('settings.lowStockAlerts')}</h3>
                    <p className="text-sm text-muted-foreground">{t('settings.lowStockAlertsDesc')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div>
                    <h3 className="font-medium">{t('settings.varianceAlerts')}</h3>
                    <p className="text-sm text-muted-foreground">{t('settings.varianceAlertsDesc')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div>
                    <h3 className="font-medium">{t('settings.orderReminders')}</h3>
                    <p className="text-sm text-muted-foreground">{t('settings.orderRemindersDesc')}</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div>
                    <h3 className="font-medium">{t('settings.countReminders')}</h3>
                    <p className="text-sm text-muted-foreground">{t('settings.countRemindersDesc')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'tablePlan' && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-6">{t('settings.tablePlan')}</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div>
                    <h3 className="font-medium">{t('settings.autoSave')}</h3>
                    <p className="text-sm text-muted-foreground">{t('settings.autoSaveDesc')}</p>
                  </div>
                  <Switch
                    checked={autoSave === true || autoSave === 'true'}
                    onCheckedChange={(checked) => {
                      updateSetting.mutate({ key: 'auto_save_table_plan', value: checked });
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'dataProtection' && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-6">Data Protection</h2>
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h3 className="font-medium mb-2">Guest Data Retention</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Guest personal data (name, email, phone, nationality) will be automatically anonymized after the retention period expires.
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={30}
                      max={3650}
                      value={dataRetentionDays}
                      onChange={(e) => {
                        const days = parseInt(e.target.value);
                        if (days >= 30 && days <= 3650) {
                          updateSetting.mutate({ key: 'data_retention_days', value: days });
                        }
                      }}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-secondary/50">
                  <h3 className="font-medium mb-2">Passport Numbers</h3>
                  <p className="text-sm text-muted-foreground">
                    Passport numbers are stored with minimal retention — only the last 4 digits and country code are kept. Full passport numbers are never stored permanently.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-secondary/50">
                  <h3 className="font-medium mb-2">Audit Logs</h3>
                  <p className="text-sm text-muted-foreground">
                    Audit logs are retained for a minimum of 2 years for compliance purposes. After that, user references are anonymized while preserving the event record.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Reservation PDFs</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Uploaded reservation PDFs are processed in-memory only and are never stored permanently. This ensures GDPR compliance by default.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
