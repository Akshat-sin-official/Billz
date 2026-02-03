import { useState } from 'react';
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

export default function Settings() {
  const { toast } = useToast();
  const [businessName, setBusinessName] = useState('Tech Store');
  const [currency, setCurrency] = useState('INR');
  const [taxCountry, setTaxCountry] = useState('india');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [invoiceStartNumber, setInvoiceStartNumber] = useState('1');

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
        <TabsList className="grid grid-cols-5 w-full">
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
