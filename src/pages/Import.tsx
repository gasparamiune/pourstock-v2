import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ArrowLeft,
  Download,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ParsedProduct {
  name: string;
  category: string;
  subtype?: string;
  unit_type: string;
  container_size?: number;
  container_unit?: string;
  cost_per_unit?: number;
  vendor?: string;
  barcode?: string;
  notes?: string;
  isValid: boolean;
  errors: string[];
}

const VALID_CATEGORIES = ['wine', 'beer', 'spirits', 'coffee', 'soda', 'syrup'];
const VALID_UNIT_TYPES = ['count', 'liters', 'grams', 'ml', 'kg'];

export default function Import() {
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);

  const validateProduct = (row: Record<string, unknown>): ParsedProduct => {
    const errors: string[] = [];
    
    const name = String(row['name'] || row['Name'] || row['PRODUCT NAME'] || row['Product Name'] || '').trim();
    if (!name) errors.push('Name is required');

    const rawCategory = String(row['category'] || row['Category'] || row['CATEGORY'] || '').toLowerCase().trim();
    const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : '';
    if (!category) errors.push(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);

    const rawUnitType = String(row['unit_type'] || row['Unit Type'] || row['UNIT TYPE'] || 'count').toLowerCase().trim();
    const unit_type = VALID_UNIT_TYPES.includes(rawUnitType) ? rawUnitType : 'count';

    const container_size = parseFloat(String(row['container_size'] || row['Container Size'] || row['SIZE'] || '')) || undefined;
    const cost_per_unit = parseFloat(String(row['cost_per_unit'] || row['Cost'] || row['COST'] || row['Price'] || '')) || undefined;

    return {
      name,
      category,
      subtype: String(row['subtype'] || row['Subtype'] || row['TYPE'] || '').trim() || undefined,
      unit_type,
      container_size,
      container_unit: String(row['container_unit'] || row['Container Unit'] || row['UNIT'] || '').trim() || undefined,
      cost_per_unit,
      vendor: String(row['vendor'] || row['Vendor'] || row['VENDOR'] || row['Supplier'] || '').trim() || undefined,
      barcode: String(row['barcode'] || row['Barcode'] || row['BARCODE'] || row['SKU'] || '').trim() || undefined,
      notes: String(row['notes'] || row['Notes'] || row['NOTES'] || '').trim() || undefined,
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an Excel (.xlsx, .xls) or CSV file.',
      });
      return;
    }

    setFile(selectedFile);
    setParsedData([]);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsed = jsonData.map((row) => validateProduct(row as Record<string, unknown>));
        setParsedData(parsed);

        const validCount = parsed.filter(p => p.isValid).length;
        toast({
          title: 'File parsed successfully',
          description: `Found ${parsed.length} products. ${validCount} valid, ${parsed.length - validCount} with errors.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error parsing file',
          description: getUserFriendlyError(error),
        });
      }
    };
    reader.readAsBinaryString(selectedFile);
  }, [toast]);

  const handleImport = async () => {
    if (!isManager) {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'You need manager privileges to import products.',
      });
      return;
    }

    const validProducts = parsedData.filter(p => p.isValid);
    if (validProducts.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No valid products',
        description: 'Please fix the errors in your data before importing.',
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < validProducts.length; i++) {
      const product = validProducts[i];
      
      const { error } = await supabase.from('products').insert({
        name: product.name,
        category: product.category as 'wine' | 'beer' | 'spirits' | 'coffee' | 'soda' | 'syrup',
        subtype: product.subtype,
        unit_type: product.unit_type as 'count' | 'liters' | 'grams' | 'ml' | 'kg',
        container_size: product.container_size,
        container_unit: product.container_unit,
        cost_per_unit: product.cost_per_unit,
        vendor: product.vendor,
        barcode: product.barcode,
        notes: product.notes,
        is_active: true,
      });

      if (error) {
        failed++;
      } else {
        success++;
      }

      setImportProgress(Math.round(((i + 1) / validProducts.length) * 100));
    }

    setIsImporting(false);
    setImportResults({ success, failed });

    if (failed === 0) {
      toast({
        title: 'Import complete!',
        description: `Successfully imported ${success} products.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Import completed with errors',
        description: `Imported ${success} products. ${failed} failed.`,
      });
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Example Wine',
        category: 'wine',
        subtype: 'red',
        unit_type: 'count',
        container_size: 0.75,
        container_unit: 'L',
        cost_per_unit: 25.00,
        vendor: 'Wine Supplier',
        barcode: '123456789',
        notes: 'Example product',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'product_import_template.xlsx');
  };

  const clearFile = () => {
    setFile(null);
    setParsedData([]);
    setImportResults(null);
  };

  const validCount = parsedData.filter(p => p.isValid).length;
  const errorCount = parsedData.length - validCount;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Import Products</h1>
          <p className="text-muted-foreground">Upload an Excel or CSV file to import products</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Upload File
            </CardTitle>
            <CardDescription>
              Upload an Excel (.xlsx) or CSV file with your product data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!file ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                <span className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  XLSX, XLS, or CSV
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={clearFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Import Status</CardTitle>
            <CardDescription>
              Review and import your products
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedData.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
                      <span className="text-2xl font-bold">{validCount}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Valid products</p>
                  </div>
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <span className="text-2xl font-bold">{errorCount}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">With errors</p>
                  </div>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Importing...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                )}

                {importResults && (
                  <div className="p-4 rounded-xl bg-muted/30">
                    <p className="font-medium">Import Complete</p>
                    <p className="text-sm text-muted-foreground">
                      {importResults.success} imported, {importResults.failed} failed
                    </p>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={handleImport}
                  disabled={isImporting || validCount === 0}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    `Import ${validCount} Products`
                  )}
                </Button>
              </>
            )}

            {parsedData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Upload a file to preview products</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>
              Review your products before importing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subtype</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((product, index) => (
                    <TableRow key={index} className={!product.isValid ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        {product.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name || '-'}</TableCell>
                      <TableCell className="capitalize">{product.category || '-'}</TableCell>
                      <TableCell>{product.subtype || '-'}</TableCell>
                      <TableCell>
                        {product.container_size 
                          ? `${product.container_size}${product.container_unit || ''}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {product.cost_per_unit ? `$${product.cost_per_unit.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>{product.vendor || '-'}</TableCell>
                      <TableCell className="text-destructive text-sm">
                        {product.errors.join(', ') || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Column Mapping Help */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Expected Columns</CardTitle>
          <CardDescription>
            Your file should include these columns (case-insensitive)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium">name *</p>
              <p className="text-muted-foreground">Product name (required)</p>
            </div>
            <div>
              <p className="font-medium">category *</p>
              <p className="text-muted-foreground">wine, beer, spirits, coffee, soda, syrup</p>
            </div>
            <div>
              <p className="font-medium">subtype</p>
              <p className="text-muted-foreground">e.g., red, white, vodka, lager</p>
            </div>
            <div>
              <p className="font-medium">unit_type</p>
              <p className="text-muted-foreground">count, liters, grams, ml, kg</p>
            </div>
            <div>
              <p className="font-medium">container_size</p>
              <p className="text-muted-foreground">e.g., 0.75, 330, 1</p>
            </div>
            <div>
              <p className="font-medium">container_unit</p>
              <p className="text-muted-foreground">e.g., L, ml, g, kg</p>
            </div>
            <div>
              <p className="font-medium">cost_per_unit</p>
              <p className="text-muted-foreground">Product cost (number)</p>
            </div>
            <div>
              <p className="font-medium">vendor</p>
              <p className="text-muted-foreground">Supplier name</p>
            </div>
            <div>
              <p className="font-medium">barcode</p>
              <p className="text-muted-foreground">Product barcode or SKU</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
