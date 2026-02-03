import { useState, useEffect } from 'react';
import {
  Building2,
  Receipt,
  Bell,
  Palette,
  Users,
  Shield,
  Globe,
  CreditCard,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/authApi';
import type { UserRole } from '@/types';

export default function Settings() {
  const { toast } = useToast();
  const [businessName, setBusinessName] = useState('Tech Store');
  const [currency, setCurrency] = useState('INR');
  const [taxCountry, setTaxCountry] = useState('india');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [invoiceStartNumber, setInvoiceStartNumber] = useState('1');

  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  // Staff management state
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffFirstName, setStaffFirstName] = useState('');
  const [staffLastName, setStaffLastName] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('cashier');
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  useEffect(() => {
    if (isOwner) {
      fetchStaff();
    }
  }, [isOwner]);

  const fetchStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const data = await authApi.getStaff();
      setStaff(data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingStaff(true);
    try {
      await authApi.addStaff({
        email: staffEmail,
        password: staffPassword,
        firstName: staffFirstName,
        lastName: staffLastName,
        role: staffRole,
      });
      toast({
        title: "Staff Added",
        description: `${staffFirstName} has been added as a ${staffRole}.`,
      });
      setStaffEmail('');
      setStaffPassword('');
      setStaffFirstName('');
      setStaffLastName('');
      fetchStaff();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add staff member.",
        variant: "destructive",
      });
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    });
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your business preferences</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className={`grid w-full ${isOwner ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="invoice" className="gap-2">
            <Receipt className="h-4 w-4" />
            Invoice
          </TabsTrigger>
          <TabsTrigger value="tax" className="gap-2">
            <Globe className="h-4 w-4" />
            Tax
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
          )}
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-6">
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Business Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input placeholder="+91 9876543210" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="business@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input placeholder="29ABCDE1234F1Z5" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Textarea placeholder="Full business address" />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Regional Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">₹ INR - Indian Rupee</SelectItem>
                      <SelectItem value="USD">$ USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">€ EUR - Euro</SelectItem>
                      <SelectItem value="GBP">£ GBP - British Pound</SelectItem>
                      <SelectItem value="AED">د.إ AED - UAE Dirham</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select defaultValue="asia_kolkata">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asia_kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="america_new_york">America/New_York (EST)</SelectItem>
                      <SelectItem value="europe_london">Europe/London (GMT)</SelectItem>
                      <SelectItem value="asia_dubai">Asia/Dubai (GST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Invoice Settings */}
        <TabsContent value="invoice" className="space-y-6">
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Invoice Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Number</Label>
                  <Input
                    type="number"
                    value={invoiceStartNumber}
                    onChange={(e) => setInvoiceStartNumber(e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    placeholder="Enter invoice terms and conditions..."
                    rows={4}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Footer Text</Label>
                  <Input placeholder="Thank you for your business!" />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Invoice Options</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Logo</Label>
                    <p className="text-sm text-muted-foreground">Display business logo on invoices</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show QR Code</Label>
                    <p className="text-sm text-muted-foreground">Include payment QR code on invoices</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-print on Sale</Label>
                    <p className="text-sm text-muted-foreground">Automatically print invoice after payment</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tax Settings */}
        <TabsContent value="tax" className="space-y-6">
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Tax Configuration</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tax Country</Label>
                  <Select value={taxCountry} onValueChange={setTaxCountry}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="india">🇮🇳 India (GST)</SelectItem>
                      <SelectItem value="usa">🇺🇸 United States (Sales Tax)</SelectItem>
                      <SelectItem value="uk">🇬🇧 United Kingdom (VAT)</SelectItem>
                      <SelectItem value="uae">🇦🇪 UAE (VAT)</SelectItem>
                      <SelectItem value="singapore">🇸🇬 Singapore (GST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {taxCountry === 'india' && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>CGST Rate (%)</Label>
                        <Input type="number" defaultValue="9" />
                      </div>
                      <div className="space-y-2">
                        <Label>SGST Rate (%)</Label>
                        <Input type="number" defaultValue="9" />
                      </div>
                      <div className="space-y-2">
                        <Label>IGST Rate (%)</Label>
                        <Input type="number" defaultValue="18" />
                      </div>
                    </div>
                  </>
                )}

                {(taxCountry === 'uk' || taxCountry === 'uae') && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>VAT Rate (%)</Label>
                      <Input type="number" defaultValue="20" />
                    </div>
                  </>
                )}

                {taxCountry === 'usa' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Sales Tax Rate (%)</Label>
                      <Input type="number" defaultValue="8.25" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Alert Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment Reminders</Label>
                    <p className="text-sm text-muted-foreground">Alerts for overdue customer payments</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Sales Summary</Label>
                    <p className="text-sm text-muted-foreground">End of day sales report</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Large Sale Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notify for sales above threshold</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sound Notifications</Label>
                    <p className="text-sm text-muted-foreground">Play sound for important alerts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Theme Settings</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme Mode</Label>
                  <Select defaultValue="system">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    {['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                      <button
                        key={color}
                        className="h-8 w-8 rounded-full border-2 border-transparent hover:border-foreground/50"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">Use smaller spacing for more data density</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Team Settings (Owner Only) */}
        {isOwner && (
          <TabsContent value="team" className="space-y-6">
            <div className="bg-card border rounded-lg p-6 space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Add Team Member
                </h3>
                <form onSubmit={handleAddStaff} className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-first-name">First Name</Label>
                    <Input
                      id="staff-first-name"
                      placeholder="John"
                      required
                      value={staffFirstName}
                      onChange={(e) => setStaffFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-last-name">Last Name</Label>
                    <Input
                      id="staff-last-name"
                      placeholder="Doe"
                      required
                      value={staffLastName}
                      onChange={(e) => setStaffLastName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-email">Email Address</Label>
                    <Input
                      id="staff-email"
                      type="email"
                      placeholder="john@example.com"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-password">Initial Password</Label>
                    <Input
                      id="staff-password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="staff-role">Access Role</Label>
                    <Select value={staffRole} onValueChange={(v: UserRole) => setStaffRole(v)}>
                      <SelectTrigger id="staff-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager (Full POS + Reports)</SelectItem>
                        <SelectItem value="cashier">Cashier (POS Only)</SelectItem>
                        <SelectItem value="auditor">Auditor (Reports Only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end col-span-2 md:col-span-1">
                    <Button type="submit" className="w-full" disabled={isAddingStaff}>
                      {isAddingStaff ? "Adding..." : "Add Staff Member"}
                    </Button>
                  </div>
                </form>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-2">Team List</h3>
                <p className="text-sm text-muted-foreground mb-4">View and manage your current staff members</p>

                {isLoadingStaff ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : staff.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Name</th>
                          <th className="px-4 py-2 text-left font-medium">Email</th>
                          <th className="px-4 py-2 text-left font-medium">Role</th>
                          <th className="px-4 py-2 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {staff.map((member) => (
                          <tr key={member.id} className="hover:bg-muted/30">
                            <td className="px-4 py-2">{member.firstName} {member.lastName}</td>
                            <td className="px-4 py-2 text-muted-foreground">{member.email}</td>
                            <td className="px-4 py-2">
                              <span className="capitalize px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                                {member.role}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <Button variant="ghost" size="sm">Edit</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-md p-8 text-center border-dashed border-2">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No staff members found</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
