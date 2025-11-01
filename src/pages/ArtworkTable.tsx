import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

export default function ArtworkTable() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Record<number, Artwork>>({});
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("selectedRows");
    if (stored) {
      try {
        setSelectedRows(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored selections", e);
      }
    }
    setTimeout(() => {
      hasLoadedRef.current = true;
    }, 0);
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) {
      localStorage.setItem("selectedRows", JSON.stringify(selectedRows));
    }
  }, [selectedRows]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(
        `https://api.artic.edu/api/v1/artworks?page=${page}`
      );
      setArtworks(res.data.data);
      setTotalRecords(res.data.pagination.total);
    };
    fetchData();
  }, [page]);

  const currentPageSelection = artworks.filter((a) => selectedRows[a.id]);

  const handleSelectionChange = (e: { value: Artwork[] }) => {
    const newSelected = { ...selectedRows };
    e.value.forEach((row) => {
      newSelected[row.id] = row;
    });

    artworks.forEach((row) => {
      if (!e.value.some((r) => r.id === row.id)) {
        delete newSelected[row.id];
      }
    });

    setSelectedRows(newSelected);
  };

  return (
    <div className="min-h-screen w-screen bg-gray-100 flex justify-center items-start p-10">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Artworks Gallery
        </h1>
        <DataTable
          value={artworks}
          lazy
          paginator
          rows={10}
          totalRecords={totalRecords}
          selection={currentPageSelection}
          onSelectionChange={handleSelectionChange}
          first={(page - 1) * 10}
          onPage={(e) => setPage(e.first / e.rows + 1)}
          selectionMode="checkbox"
          className="text-sm"
        >
          <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
          <Column field="title" header="Title" />
          <Column field="place_of_origin" header="Origin" />
          <Column field="artist_display" header="Artist" />
          <Column field="date_start" header="Start Date" />
          <Column field="date_end" header="End Date" />
        </DataTable>
      </div>
    </div>
  );
}
