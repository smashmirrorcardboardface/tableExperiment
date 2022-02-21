'use strict';
import './../style/visual.less';
import powerbi from 'powerbi-visuals-api';
import DataView = powerbi.DataView;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewTable = powerbi.DataViewTable;
import DataViewTableRow = powerbi.DataViewTableRow;
import PrimitiveValue = powerbi.PrimitiveValue;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.IVisualHost;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

import { valueFormatter } from 'powerbi-visuals-utils-formattingutils';
let iValueFormatter = valueFormatter.create({});

import { v4 as uuidv4 } from 'uuid';

export class Visual implements IVisual {
  private target: HTMLElement;
  private host: IVisualHost;
  private table: HTMLParagraphElement;

  constructor(options: VisualConstructorOptions) {
    // constructor body
    this.target = options.element;
    this.host = options.host;
    this.table = document.createElement('table');
    this.target.appendChild(this.table);
    // ...
  }

  public update(options: VisualUpdateOptions) {
    const dataView: DataView = options.dataViews[0];
    const tableDataView: DataViewTable = dataView.table;

    if (!tableDataView) {
      return;
    }
    while (this.table.firstChild) {
      this.table.removeChild(this.table.firstChild);
    }

    const transformedData = this.transformData(tableDataView);
    console.log('transformedData', transformedData);

    //draw headers
    let sortedSummaryRowColumns = [...transformedData.summaryRowColumns].sort(
      (a: any, b: any) => a.rolesIndex.summaryRowColumn[0] - b.rolesIndex.summaryRowColumn[0]
    );
    const tableHeader = document.createElement('th');
    sortedSummaryRowColumns.forEach((column) => {
      const tableHeaderColumn = document.createElement('td');
      tableHeaderColumn.innerText = column.displayName;
      tableHeader.appendChild(tableHeaderColumn);
    });
    this.table.appendChild(tableHeader);

    //draw rows
    transformedData.summaryRows.forEach((row: DataViewTableRow, index) => {
      const summaryRow = document.createElement('tr');
      let rowId = uuidv4();
      summaryRow.setAttribute('rowId', rowId);
      transformedData.summaryRowColumns.forEach((column) => {
        const cell = document.createElement('td');
        cell.innerText = row[column.displayName.replace(new RegExp(' ', 'g'), '_').toLocaleLowerCase()].toString();
        summaryRow.appendChild(cell);
      });
      this.table.appendChild(summaryRow);

      if (transformedData.detailRows[index]) {
        summaryRow.onclick = () => toggleRow(rowId);

        const detailRow = document.createElement('tr');
        const detailCell = document.createElement('td');
        detailCell.colSpan = transformedData.summaryRowColumns.length;
        detailCell.innerHTML = transformedData.detailRows[index].toString();
        detailRow.appendChild(detailCell);
        detailRow.classList.add('hide-row', 'detail-row');
        detailRow.setAttribute('id', rowId);
        this.table.appendChild(detailRow);
      }
    });

    const toggleRow = (rowId: string) => {
      const row = document.getElementById(rowId);
      row.classList.toggle('hide-row');
    };
  }

  private transformData(data: powerbi.DataViewTable) {
    console.log('data', data);

    let summaryRowColumns = data.columns.filter((c) => c.roles.summaryRowColumn);
    console.log('summaryRowColumns', summaryRowColumns);

    let detailRowMeta = data.columns.filter((c) => c.roles.detailHTML)[0];

    let summaryRowData = data.rows.map((row) => {
      return [...row.slice(0, detailRowMeta.index), ...row.slice(detailRowMeta.index + 1)];
    });

    let summaryRows = [];
    summaryRowData.forEach((row) => {
      let rowObject = {};

      summaryRowColumns.forEach((column: any, index) => {
        if (column.format !== 'D') {
          rowObject[column.displayName.replace(new RegExp(' ', 'g'), '_').toLocaleLowerCase()] =
            row[column.rolesIndex.summaryRowColumn[0]];
        } else {
          rowObject[column.displayName.replace(new RegExp(' ', 'g'), '_').toLocaleLowerCase()] = iValueFormatter.format(
            row[index]
          );
        }
      });

      summaryRows.push(rowObject);
    });

    return {
      summaryRowColumns: summaryRowColumns,
      summaryRows: summaryRows,
      detailRows: data.rows.map((row) => row[detailRowMeta.index]),
    };
  }
}
