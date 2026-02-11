import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, Sparkles, Music, Image as ImageIcon, Package, Plus, Trash2, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AudioFile, RevenueSplit, StableCoin } from '../backend';
import { FileType } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface NFTMintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audioFile: AudioFile;
  onMint: (data: {
    title: string;
    description: string;
    artist: string;
    fileType: FileType;
    price: number;
    stableCoin: StableCoin;
    royaltyPercentage: number;
    revenueSplits: RevenueSplit[];
  }) => Promise<void>;
  isLoading: boolean;
}

const STABLECOIN_OPTIONS = [
  { value: 'usdc', label: 'USDC (USD Coin)', symbol: 'USDC' },
  { value: 'tusd', label: 'TUSD (TrueUSD)', symbol: 'TUSD' },
  { value: 'rlusd', label: 'RLUSD (Ripple USD)', symbol: 'RLUSD' },
  { value: 'usde', label: 'USDE (Ethena USDe)', symbol: 'USDE' },
  { value: 'usdp', label: 'USDP (Pax Dollar)', symbol: 'USDP' },
];

export function NFTMintDialog({
  open,
  onOpenChange,
  audioFile,
  onMint,
  isLoading,
}: NFTMintDialogProps) {
  const { identity } = useInternetIdentity();
  const [mintType, setMintType] = useState<FileType>(FileType.combined);
  const [title, setTitle] = useState(audioFile.title);
  const [artist, setArtist] = useState(audioFile.creator);
  const [description, setDescription] = useState('');
  
  // Custom parameters
  const [price, setPrice] = useState<string>('10');
  const [stableCoin, setStableCoin] = useState<StableCoin>('usdc' as StableCoin);
  const [royaltyPercentage, setRoyaltyPercentage] = useState<number>(10);
  const [revenueSplits, setRevenueSplits] = useState<Array<{ address: string; percentage: string }>>([
    { address: identity?.getPrincipal().toString() || '', percentage: '100' }
  ]);

  const handleMint = async () => {
    if (!title.trim() || !artist.trim() || !description.trim()) {
      return;
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return;
    }

    // Validate revenue splits
    const totalPercentage = revenueSplits.reduce((sum, split) => {
      const pct = parseFloat(split.percentage);
      return sum + (isNaN(pct) ? 0 : pct);
    }, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
      return;
    }

    // Convert revenue splits to backend format
    const revenueSplitsFormatted: RevenueSplit[] = revenueSplits
      .filter(split => split.address.trim() !== '')
      .map(split => ({
        address: split.address.trim() as any, // Will be converted to Principal by backend
        percentage: BigInt(Math.round(parseFloat(split.percentage)))
      }));

    if (revenueSplitsFormatted.length === 0) {
      return;
    }

    await onMint({
      title: title.trim(),
      description: description.trim(),
      artist: artist.trim(),
      fileType: mintType,
      price: priceNum,
      stableCoin,
      royaltyPercentage,
      revenueSplits: revenueSplitsFormatted,
    });
  };

  const addRevenueSplit = () => {
    setRevenueSplits([...revenueSplits, { address: '', percentage: '0' }]);
  };

  const removeRevenueSplit = (index: number) => {
    if (revenueSplits.length > 1) {
      setRevenueSplits(revenueSplits.filter((_, i) => i !== index));
    }
  };

  const updateRevenueSplit = (index: number, field: 'address' | 'percentage', value: string) => {
    const updated = [...revenueSplits];
    updated[index][field] = value;
    setRevenueSplits(updated);
  };

  const totalPercentage = revenueSplits.reduce((sum, split) => {
    const pct = parseFloat(split.percentage);
    return sum + (isNaN(pct) ? 0 : pct);
  }, 0);

  const isValidPercentage = Math.abs(totalPercentage - 100) < 0.01;

  const getMintTypeLabel = (type: FileType) => {
    switch (type) {
      case FileType.audio:
        return 'Audio Only';
      case FileType.image:
        return 'Album Art Only';
      case FileType.combined:
        return 'Audio + Album Art Package';
    }
  };

  const getMintTypeIcon = (type: FileType) => {
    switch (type) {
      case FileType.audio:
        return <Music className="h-5 w-5" />;
      case FileType.image:
        return <ImageIcon className="h-5 w-5" />;
      case FileType.combined:
        return <Package className="h-5 w-5" />;
    }
  };

  const getMintTypeDescription = (type: FileType) => {
    switch (type) {
      case FileType.audio:
        return 'Mint an NFT containing only the audio file';
      case FileType.image:
        return 'Mint an NFT containing only the album artwork';
      case FileType.combined:
        return 'Mint an NFT package with both audio and album art';
    }
  };

  const canMintType = (type: FileType) => {
    if (type === FileType.audio) return true;
    if (type === FileType.image) return !!audioFile.coverImage;
    if (type === FileType.combined) return !!audioFile.coverImage;
    return false;
  };

  const selectedStableCoin = STABLECOIN_OPTIONS.find(opt => opt.value === stableCoin);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Mint NFT with Custom Parameters
          </DialogTitle>
          <DialogDescription>
            Create an NFT with custom pricing, royalties, and revenue splits using stablecoin payments.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Preview Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {audioFile.coverImage ? (
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={audioFile.coverImage.getDirectURL()}
                        alt={audioFile.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                      <Music className="h-8 w-8 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{audioFile.title}</h3>
                    <p className="text-sm text-muted-foreground">{audioFile.creator}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Duration: {Math.floor(Number(audioFile.duration) / 60)}:{(Number(audioFile.duration) % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mint Type Selection */}
            <div className="space-y-3">
              <Label>NFT Type *</Label>
              <RadioGroup value={mintType} onValueChange={(value) => setMintType(value as FileType)}>
                <div className="space-y-3">
                  {[FileType.audio, FileType.image, FileType.combined].map((type) => {
                    const disabled = !canMintType(type);
                    return (
                      <div
                        key={type}
                        className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
                          mintType === type ? 'border-primary bg-primary/5' : 'border-border'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
                        onClick={() => !disabled && setMintType(type)}
                      >
                        <RadioGroupItem value={type} id={type} disabled={disabled} className="mt-1" />
                        <div className="flex-1">
                          <Label
                            htmlFor={type}
                            className={`flex items-center gap-2 font-semibold ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {getMintTypeIcon(type)}
                            {getMintTypeLabel(type)}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {getMintTypeDescription(type)}
                          </p>
                          {disabled && type !== FileType.audio && (
                            <p className="text-xs text-destructive mt-1">
                              No album artwork available for this track
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Metadata Fields */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">NFT Metadata</h3>
              
              <div className="space-y-2">
                <Label htmlFor="nft-title">NFT Title *</Label>
                <Input
                  id="nft-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter NFT title"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nft-artist">Artist Name *</Label>
                <Input
                  id="nft-artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Enter artist name"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nft-description">Description *</Label>
                <Textarea
                  id="nft-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your NFT..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Separator />

            {/* Pricing & Payment */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing & Payment
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nft-price">Price *</Label>
                  <Input
                    id="nft-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="10.00"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stablecoin">Stablecoin *</Label>
                  <Select value={stableCoin} onValueChange={(value) => setStableCoin(value as StableCoin)}>
                    <SelectTrigger id="stablecoin">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STABLECOIN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="royalty">Royalty Percentage: {royaltyPercentage}%</Label>
                <Slider
                  id="royalty"
                  min={0}
                  max={100}
                  step={1}
                  value={[royaltyPercentage]}
                  onValueChange={(value) => setRoyaltyPercentage(value[0])}
                  disabled={isLoading}
                  className="py-4"
                />
                <p className="text-xs text-muted-foreground">
                  Royalty percentage for secondary sales (0-100%)
                </p>
              </div>
            </div>

            <Separator />

            {/* Revenue Splits */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Revenue Splits</h3>
                  <p className="text-sm text-muted-foreground">
                    Define multiple wallet addresses and their percentage shares
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRevenueSplit}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Split
                </Button>
              </div>

              <div className="space-y-3">
                {revenueSplits.map((split, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor={`address-${index}`}>Wallet Address *</Label>
                          <Input
                            id={`address-${index}`}
                            value={split.address}
                            onChange={(e) => updateRevenueSplit(index, 'address', e.target.value)}
                            placeholder="Enter principal ID or wallet address"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="w-32 space-y-2">
                          <Label htmlFor={`percentage-${index}`}>Percentage *</Label>
                          <Input
                            id={`percentage-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={split.percentage}
                            onChange={(e) => updateRevenueSplit(index, 'percentage', e.target.value)}
                            placeholder="0"
                            disabled={isLoading}
                          />
                        </div>
                        {revenueSplits.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRevenueSplit(index)}
                            disabled={isLoading}
                            className="mt-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {!isValidPercentage && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Revenue split percentages must total 100%. Current total: {totalPercentage.toFixed(2)}%
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            {/* Summary */}
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Minting Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NFT Type:</span>
                  <span className="font-medium">{getMintTypeLabel(mintType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">{price} {selectedStableCoin?.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Royalty:</span>
                  <span className="font-medium">{royaltyPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue Splits:</span>
                  <span className="font-medium">{revenueSplits.length} address(es)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium">ICRC-1 / ck{selectedStableCoin?.symbol}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleMint}
            disabled={
              isLoading || 
              !title.trim() || 
              !artist.trim() || 
              !description.trim() ||
              !isValidPercentage ||
              parseFloat(price) <= 0 ||
              revenueSplits.some(s => !s.address.trim())
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Minting...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Mint NFT
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
