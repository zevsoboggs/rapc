import { Table } from "antd";
import type { LedgerEntry } from "../types";
import { LedgerTag } from "./LedgerTag";
import { MoneyText } from "./MoneyText";
import { formatDate } from "../utils/format";

interface Props {
  data: LedgerEntry[];
  loading?: boolean;
  pagination?: false | object;
}

export const LedgerTable: React.FC<Props> = ({ data, loading, pagination }) => {
  return (
    <Table<LedgerEntry>
      rowKey="id"
      dataSource={data}
      loading={loading}
      pagination={pagination as never}
      scroll={{ x: true }}
      columns={[
        {
          title: "Date",
          dataIndex: "createdAt",
          render: (value: string) => formatDate(value),
          width: 180,
        },
        {
          title: "Type",
          dataIndex: "type",
          render: (value: string) => <LedgerTag type={value} />,
          width: 160,
        },
        {
          title: "Amount",
          dataIndex: "amount",
          align: "right",
          render: (value: string, record) => (
            <MoneyText value={value} currency={record.currency} signed colored strong />
          ),
          width: 140,
        },
        {
          title: "Balance after",
          dataIndex: "balanceAfter",
          align: "right",
          render: (value: string, record) => (
            <MoneyText value={value} currency={record.currency} />
          ),
          width: 140,
        },
        {
          title: "Description",
          dataIndex: "description",
          render: (value?: string | null) => value || "—",
        },
      ]}
    />
  );
};
