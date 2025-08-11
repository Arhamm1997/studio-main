import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function InstructionsPage() {
    const steps = [
        {
            title: "1. Review Your Campaign",
            description: "On the Dashboard, you'll find the Campaign Editor. You can modify the email's subject and body. Use merge tags like {{firstName}} and {{lastName}} for personalization. Your changes are saved automatically.",
        },
        {
            title: "2. Manage Your Contacts",
            description: "The Contacts table shows all your recipients. You can add new contacts one by one using the 'Add Contact' button. The table will show the status of each email (Pending, Sent, Error) and track open times.",
        },
        {
            title: "3. Send Your Campaign",
            description: "When you're ready, click the 'Send Campaign' button at the top of the dashboard. The system will send emails to all contacts with a 'Pending' status. You'll see a notification when the campaign is complete.",
        },
        {
            title: "4. Track Your Analytics",
            description: "The Analytics section gives you a real-time overview of your campaign's performance. It shows how many emails have been sent and, most importantly, how many have been opened.",
        },
        {
            title: "5. Automatic Open Tracking",
            description: "This is the magic! When a recipient opens your email, the 'Open Time' for that contact will automatically be updated in the table. There's no need to refresh the page; the updates will appear periodically. This works by embedding a tiny, invisible image in each email."
        }
    ];

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="text-3xl font-bold tracking-tight font-headline">How to Use Bagga Bugs</h1>
            </div>
            <p className="text-muted-foreground max-w-3xl">
                Welcome! This guide will walk you through sending your first email campaign with our powerful and easy-to-use system. Follow these simple steps to get started.
            </p>

            <div className="mt-4 grid gap-6">
                {steps.map((step, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-primary" />
                                {step.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{step.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

             <Card className="mt-6 bg-secondary">
                <CardHeader>
                    <CardTitle>A Note on Email Sending</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                       This application provides a full-featured user interface to demonstrate how an email campaign tool works. In this demonstration environment, emails are simulated and not actually delivered to recipient inboxes. The entire workflow, from sending to open tracking, is accurately represented. To send real emails, you would connect this system to an email provider like Amazon SES, SendGrid, or Resend.
                    </p>
                </CardContent>
            </Card>
        </main>
    );
}
