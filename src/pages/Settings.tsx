import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClassPicker } from '@/components/ClassPicker';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';

const Settings = () => {
  const [showClassPicker, setShowClassPicker] = useState(false);
  const navigate = useNavigate();
  
  const {
    class_label,
    subgroup_label,
    language,
    setLanguage,
    theme,
    setTheme,
    use24Hour,
    setUse24Hour,
  } = useSettingsStore();
  
  const t = translations[language];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">{t.settings}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Class Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t.selectClass}</CardTitle>
            <CardDescription>
              {class_label || t.noClass}
              {subgroup_label && ` • ${subgroup_label}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowClassPicker(true)}
              variant="outline"
              className="w-full"
            >
              {t.changeClass}
            </Button>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle>{t.language}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={(val) => setLanguage(val as 'pl' | 'en')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pl">Polski</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle>{t.themeMode}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={theme} onValueChange={(val) => setTheme(val as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">{t.system}</SelectItem>
                <SelectItem value="light">{t.light}</SelectItem>
                <SelectItem value="dark">{t.dark}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Clock Format */}
        <Card>
          <CardHeader>
            <CardTitle>{t.clockFormat}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="clock-format">{t.hour24}</Label>
              <Switch
                id="clock-format"
                checked={use24Hour}
                onCheckedChange={setUse24Hour}
              />
            </div>
          </CardContent>
        </Card>
      </main>

      <ClassPicker open={showClassPicker} onOpenChange={setShowClassPicker} />
    </div>
  );
};

export default Settings;
