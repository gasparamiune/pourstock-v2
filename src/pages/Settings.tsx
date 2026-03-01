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
import { cn } from '@/lib/utils';

type SettingsSection = 'locations' | 'users' | 'pos' | 'notifications' | 'tablePlan';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('locations');
  const { t } = useLanguage();
  const [autoSave, setAutoSave] = useState(() => localStorage.getItem('pourstock-autosave-tableplan') !== 'false');

  const sections: { id: SettingsSection; labelKey: string; icon: React.ElementType }[] = [
    { id: 'locations', labelKey: 'settings.locations', icon: MapPin },
    { id: 'users', labelKey: 'settings.usersRoles', icon: Users },
    { id: 'pos', labelKey: 'settings.spectraPOS', icon: Link },
    { id: 'notifications', labelKey: 'settings.notifications', icon: Bell },
    { id: 'tablePlan', labelKey: 'settings.tablePlan', icon: Database },
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
                {t(section.labelKey)}
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
                    checked={autoSave}
                    onCheckedChange={(checked) => {
                      setAutoSave(checked);
                      localStorage.setItem('pourstock-autosave-tableplan', String(checked));
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
