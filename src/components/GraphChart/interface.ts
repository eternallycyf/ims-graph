export interface IGraphDataRecord {
  title: string;
  content?: string;
  keyPersonName?: string;
  children?: IGraphDataRecord[];
}

export interface IGraphChartProps {
  chartType: '1' | '2';
  data: IGraphDataRecord[];
}
