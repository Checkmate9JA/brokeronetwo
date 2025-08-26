import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

export default function LanguageSelector({ variant = "select" }) {
  const { language, changeLanguage, supportedLanguages } = useLanguage();

  if (variant === "button") {
    return (
      <Button variant="ghost" size="sm" className="gap-2">
        <Globe className="w-4 h-4" />
        {supportedLanguages.find(lang => lang.code === language)?.name}
      </Button>
    );
  }

  return (
    <Select value={language} onValueChange={changeLanguage}>
      <SelectTrigger className="w-32">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {supportedLanguages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}