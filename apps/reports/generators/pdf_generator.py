# apps/reports/generators/pdf_generator.py
"""
PDF report generation using ReportLab or WeasyPrint
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from io import BytesIO
from datetime import datetime


class DonorReportGenerator:
    """
    Generate donor-focused quarterly reports
    """
    
    @staticmethod
    def generate(program, date_from, date_to, analytics_data):
        """
        Generate a PDF report for donors
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2C3E50'),
            spaceAfter=30,
            alignment=1  # Center
        )
        
        title = Paragraph(f"Program Impact Report: {program.name}", title_style)
        story.append(title)
        story.append(Spacer(1, 0.2 * inch))
        
        # Report period
        period_text = f"Report Period: {date_from.strftime('%B %d, %Y')} to {date_to.strftime('%B %d, %Y')}"
        story.append(Paragraph(period_text, styles['Normal']))
        story.append(Spacer(1, 0.3 * inch))
        
        # Executive Summary
        story.append(Paragraph("Executive Summary", styles['Heading2']))
        
        summary_data = [
            ['Metric', 'Value'],
            ['Total Participants', str(analytics_data['enrollment']['total_participants'])],
            ['Active Participants', str(analytics_data['enrollment']['active_participants'])],
            ['Completion Rate', f"{analytics_data['enrollment']['completion_rate']}%"],
            ['Average Attendance', f"{analytics_data['attendance']['average_attendance_rate']}%"],
        ]
        
        summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498DB')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Demographics
        story.append(Paragraph("Participant Demographics", styles['Heading2']))
        
        gender_data = analytics_data['demographics']['gender_distribution']
        demo_text = f"Gender Distribution: "
        for gender, count in gender_data.items():
            demo_text += f"{gender}: {count}, "
        
        story.append(Paragraph(demo_text.rstrip(', '), styles['Normal']))
        story.append(Spacer(1, 0.5 * inch))
        
        # Build PDF
        doc.build(story)
        
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content