const PDFDocument = require('pdfkit');
const { Readable } = require('stream');

async function generateTimetablePDF(timetableData, className, settings) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffer = [];

      doc.on('data', (chunk) => buffer.push(chunk));
      doc.on('end', () => {
        resolve(Buffer.concat(buffer));
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(settings?.school_name || 'LYCEE SAINT ALEXANDRE', { align: 'center' });
      doc.fontSize(14).font('Helvetica').text('Weekly Timetable', { align: 'center' });
      doc.fontSize(12).font('Helvetica-Bold').text(`Class: ${className}`, { align: 'center' });
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, { align: 'center' });
      doc.moveDown(0.5);

      // Organize timetable by day
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const timetableByDay = {};

      days.forEach(day => {
        timetableByDay[day] = timetableData.filter(entry => 
          entry.day_of_week === (days.indexOf(day) + 1) && !entry.is_temporary
        );
      });

      // Create table
      const tableRows = [];
      const timeSlots = new Set();

      // Collect all unique time slots
      Object.values(timetableByDay).forEach(entries => {
        entries.forEach(entry => {
          timeSlots.add(`${entry.start_time}-${entry.end_time}`);
        });
      });

      const sortedTimeSlots = Array.from(timeSlots).sort();

      // Build table header
      const headerRow = ['Time', ...days];
      tableRows.push(headerRow);

      // Build table data
      sortedTimeSlots.forEach(timeSlot => {
        const row = [timeSlot];
        days.forEach(day => {
          const entry = timetableByDay[day].find(e => `${e.start_time}-${e.end_time}` === timeSlot);
          if (entry) {
            row.push(
              `${entry.subject_id?.name || 'N/A'}.\n` +
              `TH:${entry.teacher_id?.name || ''}\n` 
            );
          } else {
            row.push('');
          }
        });
        tableRows.push(row);
      });

      // Draw table
      if (tableRows.length > 1) {
        drawTable(doc, tableRows);
      } else {
        doc.fontSize(12).text('No timetable entries for this class.', { align: 'center' });
      }

      // Footer
      doc.moveDown(1);
      doc.fontSize(8).text('This is an automatically generated timetable. For official use only.', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawTable(doc, rows) {
  const columnCount = rows[0].length;
  const tableX = doc.page.margins.left;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const columnWidth = pageWidth / columnCount;
  const rowHeight = 40;

  let y = doc.y;
  const pageHeight = doc.page.height - doc.page.margins.bottom;

  // Draw header
  const headerRow = rows[0];
  headerRow.forEach((cell, i) => {
    doc
      .rect(tableX + i * columnWidth, y, columnWidth, rowHeight)
      .stroke();
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(cell, tableX + i * columnWidth + 2, y + 5, {
        width: columnWidth - 4,
        height: rowHeight - 10,
        align: 'center',
        valign: 'center'
      });
  });

  y += rowHeight;

  // Draw data rows
  for (let i = 1; i < rows.length; i++) {
    // Check if we need a new page
    if (y + rowHeight > pageHeight) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    const row = rows[i];
    const maxHeight = Math.max(
      rowHeight,
      Math.max(...row.map(cell => {
        const textHeight = doc.heightOfString(cell, {
          width: columnWidth - 4,
          align: 'center'
        });
        return textHeight + 10;
      }))
    );

    row.forEach((cell, j) => {
      doc
        .rect(tableX + j * columnWidth, y, columnWidth, maxHeight)
        .stroke();
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(cell, tableX + j * columnWidth + 2, y + 5, {
          width: columnWidth - 4,
          height: maxHeight - 10,
          align: 'center',
          valign: 'top'
        });
    });

    y += maxHeight;
  }
}

module.exports = { generateTimetablePDF };
