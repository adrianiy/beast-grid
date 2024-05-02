import Excel from 'exceljs';
import { saveAs } from 'file-saver';
import { Column, Data } from '../common';

export const exportToExcel = async (data: Data, columns: Column[], fileName: string) => {
    const workBook = new Excel.Workbook();
    const sheet = workBook.addWorksheet('Sheet 1');
    const finalColumns = columns.filter((col) => col.final);

    sheet.columns = finalColumns.map((col) => ({
        header: col.headerName,
        key: col.field as string,
        width: 200,
    }));

    data.forEach((row) => {
        sheet.addRow(row);
    });

    const buffer = await workBook.xlsx.writeBuffer();

    saveAs(new Blob([buffer]), `${fileName}.xlsx`);
};
