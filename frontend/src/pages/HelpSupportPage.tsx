import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Mail, FileText, ExternalLink, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const HelpSupportPage = () => {
    const navigate = useNavigate();

    const faqs = [
        {
            question: "How do I join a virtual queue?",
            answer: "Simply tap on any location card on the Dashboard or Map view, then click 'Join Virtual Queue'. You'll receive a digital ticket with your position in line."
        },
        {
            question: "How are wait times calculated?",
            answer: "Wait times are calculated based on historical data and real-time crowd levels. The AI analyzes patterns to give you accurate estimates."
        },
        {
            question: "Can I cancel my ticket?",
            answer: "Yes! Go to 'My Tickets' and swipe or tap the cancel button on any active ticket. Your spot will be released for others."
        },
        {
            question: "What do the status colors mean?",
            answer: "Green (Safe) means low crowd levels, Orange (Busy) means moderate crowds, and Red (Crowded) means the location is very busy."
        },
        {
            question: "How does Demo Mode work?",
            answer: "Demo Mode simulates real-time crowd changes to help you understand how the app works. Toggle it from any screen to see live updates."
        },
    ];

    const supportOptions = [
        {
            icon: MessageCircle,
            label: 'Live Chat',
            description: 'Chat with our support team',
            action: () => window.open('mailto:support@smartqueue.app', '_blank')
        },
        {
            icon: Mail,
            label: 'Email Support',
            description: 'support@smartqueue.app',
            action: () => window.open('mailto:support@smartqueue.app', '_blank')
        },
        {
            icon: FileText,
            label: 'Documentation',
            description: 'Read our user guide',
            action: () => window.open('https://docs.smartqueue.app', '_blank')
        },
    ];

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
                <div className="px-4 py-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3"
                    >
                        <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="font-display text-xl font-bold text-foreground">Help & Support</h1>
                    </motion.div>
                </div>
            </header>

            <main className="px-4 py-6 space-y-6">
                {/* Contact Options */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
                >
                    <div className="p-4 border-b border-border/50">
                        <h2 className="font-medium text-foreground">Contact Us</h2>
                    </div>
                    {supportOptions.map((option, index) => (
                        <button
                            key={option.label}
                            onClick={option.action}
                            className={`w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors ${index !== supportOptions.length - 1 ? 'border-b border-border/30' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-secondary rounded-xl">
                                    <option.icon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-foreground">{option.label}</p>
                                    <p className="text-xs text-muted-foreground">{option.description}</p>
                                </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </button>
                    ))}
                </motion.div>

                {/* FAQs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
                >
                    <div className="p-4 border-b border-border/50">
                        <h2 className="font-medium text-foreground">Frequently Asked Questions</h2>
                    </div>
                    <Accordion type="single" collapsible className="px-4">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`} className="border-border/30">
                                <AccordionTrigger className="text-sm text-left hover:no-underline">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-muted-foreground">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>

                {/* App Version */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center text-xs text-muted-foreground"
                >
                    <p>SmartQueue v1.0.0</p>
                    <p className="mt-1">© 2024 SmartQueue. All rights reserved.</p>
                </motion.div>
            </main>
        </div>
    );
};

export default HelpSupportPage;
