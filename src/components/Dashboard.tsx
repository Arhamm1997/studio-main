'use client';

import type { Analytics, Campaign, Contact } from '@/lib/types';
import { useState, useTransition, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button"; // Keep Button here if used outside sub-components

import { addContact, sendCampaign, updateCampaign, deleteContacts, cleanContacts, addContacts } from '@/app/actions';
import { CircleUser, Mail, Users, BarChart, Send, PlusCircle, Loader2, Rocket, CheckCircle2, XCircle, Trash2, Sparkles, Upload } from 'lucide-react';
import { format, parseISO } from 'date-fns';

function AnalyticsCard({ analytics }: { analytics: Analytics }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart className="w-6 h-6" />Campaign Analytics</CardTitle>
                <CardDescription>An overview of your campaign performance.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-secondary">
                        <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold">{analytics.total}</p>
                        <p className="text-sm text-muted-foreground">Total Contacts</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                        <Send className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <p className="text-2xl font-bold">{analytics.sent}</p>
                        <p className="text-sm text-muted-foreground">Sent</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                        <Mail className="w-6 h-6 mx-auto mb-2 text-green-500" />
                        <p className="text-2xl font-bold">{analytics.opened}</p>
                        <p className="text-sm text-muted-foreground">Opened</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                        <Rocket className="w-6 h-6 mx-auto mb-2 text-violet-500" />
                        <p className="text-2xl font-bold">{analytics.openRate}%</p>
                        <p className="text-sm text-muted-foreground">Open Rate</p>
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-muted-foreground">Sent Progress</span>
                            <span className="text-sm font-medium">{analytics.sent} / {analytics.total}</span>
                        </div>
                        <Progress value={analytics.sentRate} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


function AddContactDialog({ onAdd }: { onAdd: (contact: Omit<Contact, 'id'>) => void }) {
    const [isPending, startTransition] = useTransition();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleAdd = () => {
        startTransition(() => {
            onAdd({ firstName, lastName, email, status: 'Pending', sentTimestamp: null, openTimestamp: null });
            setIsOpen(false);
            setFirstName('');
            setLastName('');
            setEmail('');
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Contact
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                    <DialogDescription>Enter the details for the new contact.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleAdd} disabled={isPending || !email}>
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add Contact'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ContactsTable({ 
    contacts, 
    onAddContact, 
    onAddContacts,
    onDeleteContacts,
    onCleanContacts,
}: { 
    contacts: Contact[], 
    onAddContact: (contact: Omit<Contact, 'id'>) => void,
    onAddContacts: (contacts: Omit<Contact, 'id'>[]) => void,
    onDeleteContacts: (ids: string[]) => void,
    onCleanContacts: (ids: string[]) => void,
}) {
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAllSelected = contacts.length > 0 && selectedContactIds.length === contacts.length;

    const handleSelectAll = (checked: boolean) => {
        setSelectedContactIds(checked ? contacts.map(c => c.id) : []);
    };

    const handleSelectOne = (contactId: string, checked: boolean) => {
        setSelectedContactIds(prev =>
            checked ? [...prev, contactId] : prev.filter(id => id !== contactId)
        );
    };
    
    const handleDelete = () => {
        startTransition(() => {
            onDeleteContacts(selectedContactIds);
            setSelectedContactIds([]);
        });
    };
    
    const handleClean = () => {
        startTransition(() => {
            onCleanContacts(selectedContactIds);
            setSelectedContactIds([]);
        });
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text !== 'string') return;
            
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const header = lines[0].split(',').map(h => h.trim());
            const emailIndex = header.findIndex(h => h.toLowerCase() === 'email');
            const firstNameIndex = header.findIndex(h => h.toLowerCase() === 'firstname' || h.toLowerCase() === 'first name');
            const lastNameIndex = header.findIndex(h => h.toLowerCase() === 'lastname' || h.toLowerCase() === 'last name');
            
            if (emailIndex === -1) {
                // You would use your toast hook here to show an error
                console.error("CSV must have an 'email' column.");
                return;
            }

            const newContacts = lines.slice(1).map(line => {
                const values = line.split(',');
                return {
                    email: values[emailIndex]?.trim() || '',
                    firstName: values[firstNameIndex]?.trim() || '',
                    lastName: values[lastNameIndex]?.trim() || '',
                };
            }).filter(c => c.email);
            
            startTransition(() => {
                onAddContacts(newContacts);
            });
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    };

    const StatusPill = ({ status }: { status: Contact['status'] }) => {
        const baseClasses = "px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5";
        if (status === 'Sent') {
            return <div className={`${baseClasses} bg-blue-100 text-blue-800`}><CheckCircle2 className="w-3 h-3" />Sent</div>;
        }
        if (status === 'Error') {
            return <div className={`${baseClasses} bg-red-100 text-red-800`}><XCircle className="w-3 h-3" />Error</div>;
        }
        return <div className={`${baseClasses} bg-yellow-100 text-yellow-800`}><Loader2 className="w-3 h-3 animate-spin" />Pending</div>;
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><CircleUser className="w-6 h-6" />Contacts</CardTitle>
                    <CardDescription>Manage your campaign recipients.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv" className="hidden" />
                    <Button variant="outline" onClick={handleImportClick}><Upload className="mr-2 h-4 w-4" />Import CSV</Button>
                    <AddContactDialog onAdd={onAddContact} />
                </div>
            </CardHeader>
            <CardContent>
                 {selectedContactIds.length > 0 && (
                    <div className="mb-4 flex items-center gap-2 p-2 rounded-lg bg-secondary">
                        <p className="text-sm font-medium">{selectedContactIds.length} selected</p>
                        <Button variant="outline" size="sm" onClick={handleClean} disabled={isPending}><Sparkles className="mr-2 h-4 w-4" />Clean</Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                    </div>
                 )}
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-secondary">
                            <TableRow>
                                <TableHead className="w-[50px]"><Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} /></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Sent Time</TableHead>
                                <TableHead>Open Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No contacts yet. Add one or import a CSV to get started!
                                    </TableCell>
                                </TableRow>
                            ) : contacts.map(contact => (
                                <TableRow key={contact.id} data-state={selectedContactIds.includes(contact.id) && "selected"}>
                                    <TableCell><Checkbox checked={selectedContactIds.includes(contact.id)} onCheckedChange={(checked) => handleSelectOne(contact.id, !!checked)} /></TableCell>
                                    <TableCell className="font-medium">{contact.firstName} {contact.lastName}</TableCell>
                                    <TableCell className="text-muted-foreground">{contact.email}</TableCell>
                                    <TableCell><StatusPill status={contact.status} /></TableCell>
                                    <TableCell>{contact.sentTimestamp ? format(parseISO(contact.sentTimestamp), 'Pp') : '—'}</TableCell>
                                    <TableCell>{contact.openTimestamp ? <span className="text-green-600 font-medium">{format(parseISO(contact.openTimestamp), 'Pp')}</span> : '—'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Dashboard({ initialCampaign, initialContacts, initialAnalytics }: { initialCampaign: Campaign, initialContacts: Contact[], initialAnalytics: Analytics }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSending, startSendingTransition] = useTransition();

    const campaign = useMemo(() => initialCampaign, [initialCampaign]);
    const contacts = useMemo(() => initialContacts, [initialContacts]);
    const analytics = useMemo(() => initialAnalytics, [initialAnalytics]);

    const refreshData = () => {
        router.refresh();
    };
    
    const handleSaveCampaign = async (data: Campaign) => {
        const result = await updateCampaign(data);
        if (result.success) {
            toast({
                title: "Success!",
                description: result.message,
                className: "bg-green-100 text-green-900 border-green-200",
            });
            refreshData();
        }
    };
    
    const handleAddContact = async (contactData: Omit<Contact, 'id'>) => {
        const result = await addContact(contactData);
        if (result.success) {
             toast({
                title: "Contact Added",
                description: `${contactData.firstName} has been added to your list.`,
            });
            refreshData();
        }
    };
    
    const handleAddContacts = async (contactsData: Omit<Contact, 'id'>[]) => {
        const result = await addContacts(contactsData);
        if (result.success) {
             toast({
                title: "Import Successful",
                description: result.message,
            });
            refreshData();
        }
    };

    const handleDeleteContacts = async (ids: string[]) => {
        const result = await deleteContacts(ids);
        if (result.success) {
             toast({
                title: "Contacts Deleted",
                description: result.message,
            });
            refreshData();
        }
    };
    
    const handleCleanContacts = async (ids: string[]) => {
        const result = await cleanContacts(ids);
        if (result.success) {
             toast({
                title: "Contacts Cleaned",
                description: result.message,
            });
            refreshData();
        }
    };

    const handleSendCampaign = () => {
        startSendingTransition(async () => {
            const result = await sendCampaign();
            if (result.success) {
                toast({
                    title: "Campaign Sent!",
                    description: result.message,
                    className: "bg-green-100 text-green-900 border-green-200",
                });
                refreshData();
            } else {
                toast({
                    variant: "destructive",
                    title: "Campaign Failed",
                    description: result.message,
                });
            }
        });
    };

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Campaign Dashboard</h1>
                    <p className="text-muted-foreground">Manage and send your email campaigns with perfect tracking.</p>
                </div>
                <Button size="lg" onClick={handleSendCampaign} disabled={isSending}>
                    {isSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Campaign...</> : <><Send className="mr-2 h-4 w-4" /> Send Campaign</>}
                </Button>
            </div>

            <div className="grid gap-4 md:gap-8">
                <AnalyticsCard analytics={analytics} />

                <Tabs defaultValue="campaign-editor" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="campaign-editor">Campaign Editor</TabsTrigger>
                        <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="campaign-editor" className="pt-4">
                        <CampaignEditor campaign={campaign} onSave={handleSaveCampaign} />
                    </TabsContent>

                    <TabsContent value="contacts" className="pt-4">
                        <ContactsTable 
                            contacts={contacts} 
                            onAddContact={handleAddContact}
                            onAddContacts={handleAddContacts}
                            onDeleteContacts={handleDeleteContacts}
                            onCleanContacts={handleCleanContacts}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}

function CampaignEditor({ campaign, onSave }: { campaign: Campaign, onSave: (data: Campaign) => void }) {
    const [isPending, startTransition] = useTransition();
    const [subject, setSubject] = useState(campaign.subject);
    const [body, setBody] = useState(campaign.body);
    const [senderName, setSenderName] = useState(campaign.senderName);
    const [senderEmail, setSenderEmail] = useState(campaign.senderEmail);

    const handleSave = () => {
        startTransition(() => {
            onSave({ ...campaign, subject, body, senderName, senderEmail });
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Campaign Editor</CardTitle>
                <CardDescription>Craft your email content and settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. An important message for {{firstName}}" />
                        <p className="text-xs text-muted-foreground mt-1">Use {'{{firstName}}'} and {'{{lastName}}'} for personalization.</p>
                    </div>
                    <div>
                        <Label htmlFor="body">Body</Label>
                        <Textarea id="body" value={body} onChange={e => setBody(e.target.value)} rows={10} placeholder="e.g. Dear {{firstName}}," />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Campaign'}
                 </Button>
            </CardFooter>
        </Card>
    );
}
