import { Layout } from '@/components/layout/Layout';
import { EventsCalendar } from '@/components/events/EventsCalendar';

export default function Events() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <EventsCalendar />
      </div>
    </Layout>
  );
}
