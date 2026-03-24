import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { RoomBoard } from '@/components/reception/RoomBoard';
import { TodayOverview } from '@/components/reception/TodayOverview';
import { GuestDirectory } from '@/components/reception/GuestDirectory';
import { FolioSheet } from '@/components/reception/FolioSheet';
import { ReceptionAnalytics } from '@/components/reception/ReceptionAnalytics';
import { DocumentCentre } from '@/components/reception/DocumentCentre';
import { ProblemSolver } from '@/components/reception/ProblemSolver';
import { CompliancePanel } from '@/components/reception/CompliancePanel';

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
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="rooms">{t('reception.roomBoard')}</TabsTrigger>
          <TabsTrigger value="today">{t('reception.today')}</TabsTrigger>
          <TabsTrigger value="guests">{t('reception.guestDirectory')}</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="problem-solver">Problem Solver</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
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

        <TabsContent value="billing" className="mt-4">
          <FolioSheet />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <ReceptionAnalytics />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentCentre />
        </TabsContent>

        <TabsContent value="problem-solver" className="mt-4">
          <ProblemSolver />
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <CompliancePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
