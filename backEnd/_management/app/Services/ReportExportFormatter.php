<?php

namespace App\Services;

use ZipArchive;

class ReportExportFormatter
{
    /** @return array{extension:string,contentType:string,content:string} */
    public static function make(string $format, array $metrics): array
    {
        $rows = [['metric', 'value']];
        foreach ($metrics as $name => $value) $rows[] = [(string) $name, (string) $value];
        return match ($format) {
            'csv' => ['extension' => 'csv', 'contentType' => 'text/csv; charset=utf-8', 'content' => self::csv($rows)],
            'xlsx' => ['extension' => 'xlsx', 'contentType' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content' => self::xlsx($rows)],
            'docx' => ['extension' => 'docx', 'contentType' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'content' => self::docx($rows)],
            'pdf' => ['extension' => 'pdf', 'contentType' => 'application/pdf', 'content' => self::pdf($rows)],
        };
    }

    private static function csv(array $rows): string
    {
        return collect($rows)->map(fn (array $row) => implode(',', array_map(fn (string $value) => '"'.str_replace('"', '""', $value).'"', $row)))->implode("\n");
    }

    private static function xlsx(array $rows): string
    {
        $sheetRows = '';
        foreach ($rows as $index => $row) {
            $cells = '';
            foreach ($row as $column => $value) $cells .= '<c r="'.chr(65 + $column).($index + 1).'" t="inlineStr"><is><t>'.self::xml($value).'</t></is></c>';
            $sheetRows .= '<row r="'.($index + 1).'">'.$cells.'</row>';
        }
        return self::zip([
            '[Content_Types].xml' => '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
            '_rels/.rels' => '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
            'xl/workbook.xml' => '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets></workbook>',
            'xl/_rels/workbook.xml.rels' => '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
            'xl/worksheets/sheet1.xml' => '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'.$sheetRows.'</sheetData></worksheet>',
        ]);
    }

    private static function docx(array $rows): string
    {
        $paragraphs = implode('', array_map(fn (array $row) => '<w:p><w:r><w:t>'.self::xml($row[0].': '.$row[1]).'</w:t></w:r></w:p>', $rows));
        return self::zip([
            '[Content_Types].xml' => '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
            '_rels/.rels' => '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
            'word/document.xml' => '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'.$paragraphs.'</w:body></w:document>',
        ]);
    }

    private static function pdf(array $rows): string
    {
        $text = implode("\n", array_map(fn (array $row) => $row[0].': '.$row[1], $rows));
        $stream = "BT /F1 12 Tf 50 760 Td 16 TL (".str_replace(['\\', '(', ')', "\n"], ['\\\\', '\\(', '\\)', ') Tj T* ('], $text).") Tj ET";
        $objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>", "<< /Length ".strlen($stream)." >>\nstream\n$stream\nendstream", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
        $pdf = "%PDF-1.4\n"; $offsets = [0];
        foreach ($objects as $number => $object) { $offsets[] = strlen($pdf); $pdf .= ($number + 1)." 0 obj\n$object\nendobj\n"; }
        $xref = strlen($pdf); $pdf .= 'xref'."\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n"; foreach (array_slice($offsets, 1) as $offset) $pdf .= sprintf('%010d 00000 n ', $offset)."\n";
        return $pdf.'trailer << /Size '.(count($objects) + 1).' /Root 1 0 R >>'."\nstartxref\n$xref\n%%EOF";
    }

    private static function zip(array $entries): string
    {
        $path = tempnam(sys_get_temp_dir(), 'report-export-'); $zip = new ZipArchive(); $zip->open($path, ZipArchive::OVERWRITE);
        foreach ($entries as $name => $content) $zip->addFromString($name, $content);
        $zip->close(); $content = file_get_contents($path); unlink($path); return $content ?: '';
    }

    private static function xml(string $value): string { return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8'); }
}
