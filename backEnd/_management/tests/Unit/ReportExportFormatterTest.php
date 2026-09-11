<?php

namespace Tests\Unit;

use App\Services\ReportExportFormatter;
use Tests\TestCase;

class ReportExportFormatterTest extends TestCase
{
    public function test_it_generates_the_requested_file_type(): void
    {
        $metrics = ['collections' => 1200, 'paymentsCount' => 2];
        $csv = ReportExportFormatter::make('csv', $metrics); $xlsx = ReportExportFormatter::make('xlsx', $metrics); $docx = ReportExportFormatter::make('docx', $metrics); $pdf = ReportExportFormatter::make('pdf', $metrics);
        $this->assertSame('csv', $csv['extension']); $this->assertStringContainsString('collections', $csv['content']);
        $this->assertSame('xlsx', $xlsx['extension']); $this->assertSame('PK', substr($xlsx['content'], 0, 2));
        $this->assertSame('docx', $docx['extension']); $this->assertSame('PK', substr($docx['content'], 0, 2));
        $this->assertSame('pdf', $pdf['extension']); $this->assertStringStartsWith('%PDF-', $pdf['content']);
    }
}
