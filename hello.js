import { writeFileSync, readFileSync } from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import asyncLock from 'async-lock';

const lock = new asyncLock();

// Function to generate a unique ID with a counter
function generateUniqueID(counter) {
  return `COMJB${counter}`;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      console.log('req.body >> ', req.body);
      const { id, name, mobile, issue } = req.body;

      const filePath = path.join(process.cwd(), './formData.xlsx');

      // Use a lock to ensure only one update operation at a time
      const lineNum = await lock.acquire('updateExcelFile', async () => {
        const dataBuffer = readFileSync(filePath);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(dataBuffer);

        const sheet = workbook.worksheets[0];

        // Find the last row to get the current counter value
        const lastRow = sheet.lastRow || sheet.getRow(sheet.actualRowCount);
        const currentCounter = lastRow ? parseInt(lastRow.getCell(1).value.toString().replace('COMJB', '')) : 0;

        // Increment the counter
        const newCounter = currentCounter + 1;

        // Generate the unique ID
        const uniqueID = generateUniqueID(newCounter);

        // Get the current date and time
        const currentDate = new Date();

        // Format date as dd-mm-yyyy
        const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getFullYear()}`;

        // Format time as hh:mm:ss
        const formattedTime = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;

        const newRow = sheet.addRow([uniqueID, id, name, mobile, issue, formattedDate, formattedTime]);
        const updatedDataBuffer = await workbook.xlsx.writeBuffer();

        writeFileSync(filePath, updatedDataBuffer);

        // Return the line number of the saved document
        return newRow.number;
      });

      res.status(200).json({ message: 'Data has been successfully added to the Excel file.', lineNum });
    } catch (error) {
      console.error('Error saving data to Excel file:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
