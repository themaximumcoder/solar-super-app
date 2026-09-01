"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Ticket, User, MapPin, Phone, MessageSquare, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Ticket = {
  id: string;
  customerName: string;
  contactInfo: string;
  address: string;
  issueDescription: string;
  status: "OPEN" | "CLAIMED" | "RESOLVED";
  createdAt: string;
};

export default function TicketsDashboard() {
  const [openTickets, setOpenTickets] = useState<Ticket[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setOpenTickets(data.openTickets || []);
      setMyTickets(data.myTickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleAction = async (ticketId: string, action: "CLAIM" | "RESOLVE" | "UNCLAIM") => {
    try {
      const res = await fetch("/api/tickets/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, action }),
      });
      if (res.ok) {
        fetchTickets(); // Refresh lists
      }
    } catch (err) {
      console.error("Failed to perform action", err);
    }
  };

  const renderTicketCard = (ticket: Ticket, isMine: boolean) => (
    <div key={ticket.id} className="glass-panel p-5 rounded-2xl border border-[hsl(var(--border))] flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${isMine ? (ticket.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500') : 'bg-orange-500/10 text-orange-500'}`}>
            {ticket.status === 'RESOLVED' ? <CheckCircle size={20} /> : <Ticket size={20} />}
          </div>
          <div>
            <span className="text-xs text-[hsl(var(--muted-foreground))] block">
              {new Date(ticket.createdAt).toLocaleString()}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
              ticket.status === 'OPEN' ? 'bg-orange-500/20 text-orange-500' : 
              ticket.status === 'CLAIMED' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'
            }`}>
              {ticket.status}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3 flex-1">
        <p className="text-sm font-semibold flex items-center"><User size={16} className="mr-2 text-[hsl(var(--muted-foreground))]" /> {ticket.customerName}</p>
        <p className="text-sm flex items-center"><Phone size={16} className="mr-2 text-[hsl(var(--muted-foreground))]" /> {ticket.contactInfo}</p>
        <p className="text-sm flex items-start"><MapPin size={16} className="mr-2 mt-0.5 text-[hsl(var(--muted-foreground))] flex-shrink-0" /> {ticket.address}</p>
        <div className="bg-[hsl(var(--secondary))/0.5] p-3 rounded-lg text-sm flex items-start mt-2 border border-[hsl(var(--border))]">
          <MessageSquare size={16} className="mr-2 mt-0.5 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
          <p className="text-xs leading-relaxed">{ticket.issueDescription}</p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-[hsl(var(--border))] flex gap-2">
        {!isMine && ticket.status === "OPEN" && (
          <button onClick={() => handleAction(ticket.id, "CLAIM")} className="btn-primary w-full py-2 text-sm flex items-center justify-center">
             Claim Ticket
          </button>
        )}
        {isMine && ticket.status === "CLAIMED" && (
          <>
            <button onClick={() => handleAction(ticket.id, "RESOLVE")} className="btn-primary w-full py-2 text-sm bg-green-600 hover:bg-green-700 text-white flex items-center justify-center">
              Mark Resolved
            </button>
            <button onClick={() => handleAction(ticket.id, "UNCLAIM")} className="px-4 py-2 text-sm rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
              Unclaim
            </button>
          </>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading tickets...</div>;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6 lg:p-12 relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <Link href="/" className="inline-flex items-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold flex items-center"><Ticket className="mr-3 text-[hsl(var(--primary))]" /> Support Tickets</h1>
            <p className="text-[hsl(var(--muted-foreground))] mt-2">Manage customer consultation requests and site visits.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* OPEN TICKETS */}
          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Clock className="mr-2 text-orange-500" /> Open Requests
              <span className="ml-3 bg-orange-500/20 text-orange-500 text-xs py-1 px-3 rounded-full font-bold">{openTickets.length}</span>
            </h2>
            {openTickets.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center border-dashed border-2 border-[hsl(var(--border))]">
                <p className="text-[hsl(var(--muted-foreground))]">No open tickets at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {openTickets.map(ticket => renderTicketCard(ticket, false))}
              </div>
            )}
          </section>

          {/* MY TICKETS */}
          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <User className="mr-2 text-blue-500" /> My Claimed Tickets
              <span className="ml-3 bg-blue-500/20 text-blue-500 text-xs py-1 px-3 rounded-full font-bold">{myTickets.length}</span>
            </h2>
            {myTickets.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center border-dashed border-2 border-[hsl(var(--border))]">
                <p className="text-[hsl(var(--muted-foreground))]">You haven't claimed any tickets yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {myTickets.map(ticket => renderTicketCard(ticket, true))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
