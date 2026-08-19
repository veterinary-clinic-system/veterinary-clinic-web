import { useState } from 'react';
import { examinationsApi } from '@/api/examinations.api';
import { Button } from '@/components/basic';

export function DownloadPdfButton({ examinationId }: { examinationId: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      loading={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await examinationsApi.downloadPdf(examinationId);
        } finally {
          setLoading(false);
        }
      }}
    >
      Xuất PDF
    </Button>
  );
}
