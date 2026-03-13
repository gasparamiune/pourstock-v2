import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { RoomBoard } from '@/components/reception/RoomBoard';
import { TodayOverview } from '@/components/reception/TodayOverview';
import { GuestDirectory } from '@/components/reception/GuestDirectory';

export default function Reception() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('rooms');

  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">{t('reception.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('reception.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rooms">{t('reception.roomBoard')}</TabsTrigger>
          <TabsTrigger value="today">{t('reception.today')}</TabsTrigger>
          <TabsTrigger value="guests">{t('reception.guestDirectory')}</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="mt-4">
          <RoomBoard />
        </TabsContent>

        <TabsContent value="today" className="mt-4">
          <TodayOverview />
        </TabsContent>

        <TabsContent value="guests" className="mt-4">
          <GuestDirectory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
