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

    //draw headers
    const tableHeader = document.createElement('th');
    transformedData.headings.forEach((column: DataViewMetadataColumn) => {
      const tableHeaderColumn = document.createElement('td');
      tableHeaderColumn.innerText = column.displayName;
      tableHeader.appendChild(tableHeaderColumn);
    });
    this.table.appendChild(tableHeader);

    //draw rows
    transformedData.summaryRowData.forEach((row: DataViewTableRow, index) => {
      const summaryRow = document.createElement('tr');
      let rowId = uuidv4();
      summaryRow.setAttribute('rowId', rowId);
      row.forEach((columnValue: PrimitiveValue) => {
        const cell = document.createElement('td');
        cell.innerText = columnValue.toString();
        summaryRow.appendChild(cell);
      });
      this.table.appendChild(summaryRow);

      if (transformedData.detailRowData[index]) {
        summaryRow.onclick = () => toggleRow(rowId);

        const detailRow = document.createElement('tr');
        const detailCell = document.createElement('td');
        detailCell.colSpan = transformedData.headings.length;
        detailCell.innerHTML = transformedData.detailRowData[index].toString();
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
    let headings = data.columns.filter((c) => c.roles.summaryRow);

    let detailRowMeta = data.columns.filter((c) => c.roles.detailHTML)[0];

    let summaryRowData = data.rows.map((row) => {
      return [...row.slice(0, detailRowMeta.index), ...row.slice(detailRowMeta.index + 1)];
    });

    let detailRowData = data.rows.map((row) => {
      return row[detailRowMeta.index];
    });

    return {
      headings: headings,
      summaryRowData: summaryRowData,
      detailRowMeta: detailRowMeta,
      detailRowData: detailRowData,
    };
  }
}
