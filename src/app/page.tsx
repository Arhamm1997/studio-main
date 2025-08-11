import Dashboard from "@/components/Dashboard";
import { getCampaign, getContacts, getAnalytics } from "@/app/actions";

export default async function DashboardPage() {
  const campaign = await getCampaign();
  const contacts = await getContacts();
  const analytics = await getAnalytics();

  return (
    <Dashboard
      initialCampaign={campaign}
      initialContacts={contacts}
      initialAnalytics={analytics}
    />
  );
}
