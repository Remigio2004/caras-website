import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DonationsView from "./DonationsView";
import ExpensesView from "./ExpensesView";

export default function FinanceView() {
  const [tab, setTab] = useState("donations");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-display font-semibold">Finance</h2>
        <p className="text-sm text-muted-foreground">
          Track donations received and expenses spent, para transparent ang fund movement.
        </p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="donations" className="mt-4">
          <DonationsView />
        </TabsContent>
        <TabsContent value="expenses" className="mt-4">
          <ExpensesView />
        </TabsContent>
      </Tabs>
    </div>
  );
}