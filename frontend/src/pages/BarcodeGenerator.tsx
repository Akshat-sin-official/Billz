import { useState, useRef } from 'react';
import Barcode from 'react-barcode';
import { Package, Printer, Plus, Trash2, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useManualLabelsStore } from '@/store/manualLabelsStore';
import { useToast } from '@/hooks/use-toast';
import { createManualBarcode } from '@/lib/looseProductBarcode';

interface LabelItem {
  id: string;
  productName: string;
  unit: string;
  weight: number;
  pricePerUnit: number;
  totalPrice: number;
  barcode: string;
}

const UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'l', label: 'l' },
  { value: 'ml', label: 'ml' },
  { value: 'pcs', label: 'pcs' },
];

export default function BarcodeGenerator() {
  const { addLabel, getLabel } = useManualLabelsStore();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [productName, setProductName] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [unit, setUnit] = useState('kg');
  const [weight, setWeight] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [labels, setLabels] = useState<LabelItem[]>([]);

  const w = parseFloat(weight) || 0;
  const price = parseFloat(pricePerUnit) || 0;
  const totalPrice = w * price;

  const handleAddLabel = () => {
    const name = productName.trim();
    if (!name) {
      toast({
        title: 'Missing product name',
        description: 'Enter the product name',
        variant: 'destructive',
      });
      return;
    }
    if (price <= 0) {
      toast({
        title: 'Invalid price',
        description: 'Enter a valid price per unit',
        variant: 'destructive',
      });
      return;
    }
    if (w <= 0) {
      toast({
        title: 'Invalid weight',
        description: 'Enter a valid weight/quantity',
        variant: 'destructive',
      });
      return;
    }

    const labelId = addLabel({
      productName: name,
      unit,
      pricePerUnit: price,
      weight: w,
      totalPrice: w * price,
      taxRate,
    });
    const barcode = createManualBarcode(labelId);
    const labelData = getLabel(labelId)!;

    setLabels((prev) => [
      ...prev,
      {
        id: labelId,
        productName: name,
        unit,
        weight: w,
        pricePerUnit: price,
        totalPrice: labelData.totalPrice,
        barcode,
      },
    ]);

    setProductName('');
    setPricePerUnit('');
    setWeight('');
    toast({
      title: 'Label added',
      description: `${name} (${w} ${unit}) — ₹${(w * price).toFixed(2)}`,
    });
  };

  const handleRemoveLabel = (id: string) => {
    setLabels((prev) => prev.filter((l) => l.id !== id));
  };

  const handlePrint = () => {
    if (labels.length === 0) {
      toast({
        title: 'No labels',
        description: 'Add at least one label to print',
        variant: 'destructive',
      });
      return;
    }
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Print failed',
        description: 'Could not open print window. Allow popups and try again.',
        variant: 'destructive',
      });
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Product Labels</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 16px; }
            .labels { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
            .label { border: 1px dashed #ccc; padding: 12px; text-align: center; page-break-inside: avoid; }
            .label-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
            .label-weight { font-size: 12px; color: #666; margin-bottom: 8px; }
            .label-price { font-size: 16px; font-weight: 700; color: #0ea5e9; margin-top: 8px; }
            svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div class="labels">${printContent.innerHTML}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    toast({ title: 'Print dialog opened', description: 'Select your label printer' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Package className="h-6 w-6" />
          Barcode Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Manually enter product details and generate barcode labels for your shop
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5" />
              Manual Entry
            </CardTitle>
            <CardDescription>
              Enter product name, price, and weight to create a barcode label
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input
                placeholder="e.g. Basmati Rice, Almonds"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price per unit (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 120"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Weight / Quantity</Label>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                placeholder="e.g. 0.5, 1.25"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
              />
            </div>

            <div className="space-y-2">
              <Label>Tax Rate (%) – optional</Label>
              <Select value={taxRate.toString()} onValueChange={(v) => setTaxRate(parseFloat(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (price is final)</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="18">18%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {productName && price > 0 && w > 0 && (
              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total price</span>
                  <span className="font-semibold text-primary">₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleAddLabel}
              className="w-full"
              disabled={!productName.trim() || price <= 0 || w <= 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Print Queue
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Print Queue</CardTitle>
            <CardDescription>
              {labels.length} label(s) ready. Click Print to open print dialog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {labels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 mb-2 opacity-50" />
                <p>No labels in queue</p>
                <p className="text-sm">Enter product details and add labels</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{label.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {label.weight} {label.unit} × ₹{label.pricePerUnit} = ₹
                        {label.totalPrice.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLabel(label.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {labels.length > 0 && (
              <Button onClick={handlePrint} className="mt-4 w-full" variant="default">
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Off-screen print content */}
      <div ref={printRef} className="absolute -left-[9999px] top-0 w-[400px]" aria-hidden="true">
        {labels.map((label) => (
          <div key={label.id} className="label">
            <div className="label-name">{label.productName}</div>
            <div className="label-weight">
              {label.weight} {label.unit}
            </div>
            <Barcode
              value={label.barcode}
              format="CODE128"
              width={1.5}
              height={40}
              displayValue={true}
              margin={0}
            />
            <div className="label-price">₹{label.totalPrice.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
