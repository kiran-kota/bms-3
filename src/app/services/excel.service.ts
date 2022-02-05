import { Injectable } from '@angular/core';  
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';  
import * as XLSX from 'xlsx';  
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';  
const EXCEL_EXTENSION = '.xlsx'; 
@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor() { }

  generateExcel(header:any, data:any, filename:string) {
    
    //Create workbook and worksheet
    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Details');

    //Add Header Row
    let headerRow = worksheet.addRow(header);
    headerRow.font = { name: 'Calibri', size: 11, bold: true }
    // Cell Style : Fill and Border
    headerRow.eachCell((cell, number) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' },
        bgColor: { argb: 'FF0000FF' }
      }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    });

    worksheet.addRows(data);  

   


    //Generate Excel File with given name
    workbook.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, filename + '.xlsx');
    })
  }
  generateAnalysisExcel(header:any, data:any, data2:any, filename:string) {
    
    //Create workbook and worksheet
    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet(filename == 'profit' ? 'Sale' : 'Qty');

    //Add Header Row
    let headerRow = worksheet.addRow(header);
    headerRow.font = { name: 'Calibri', size: 11, bold: true }
    // Cell Style : Fill and Border
    headerRow.eachCell((cell, number) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' },
        bgColor: { argb: 'FF0000FF' }
      }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    });

    worksheet.addRows(data);  

   
    let worksheet2 = workbook.addWorksheet( filename == 'profit' ? 'Profit' : 'Amount');

    //Add Header Row
    let headerRow2 = worksheet2.addRow(header);
    headerRow2.font = { name: 'Calibri', size: 11, bold: true }
    // Cell Style : Fill and Border
    headerRow2.eachCell((cell, number) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' },
        bgColor: { argb: 'FF0000FF' }
      }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    });

    worksheet2.addRows(data2);  

    //Generate Excel File with given name
    workbook.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, filename + '.xlsx');
    })
  }
 
  convertExcelToJson(file)
   {
    let reader = new FileReader();
    let workbookkk;
    let XL_row_object;
    let json_object;
    reader.readAsBinaryString(file);
    return new Promise((resolve, reject) => {
      reader.onload = function(){
        //  alert(reader.result);
        let data = reader.result;
         workbookkk= XLSX.read(data,{type: 'binary'});
        //  console.log(workbookkk);
         workbookkk.SheetNames.forEach(function(sheetName) {
          // Here is your object
           XL_row_object = XLSX.utils.sheet_to_json(workbookkk.Sheets[sheetName]);
           json_object = JSON.stringify(XL_row_object);
        //  console.log(json_object);
        //  console.log(XL_row_object);
            resolve(XL_row_object);
        });
        };
    });
    }
}
