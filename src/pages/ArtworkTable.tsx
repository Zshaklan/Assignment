import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { IoMdArrowDropdownCircle } from "react-icons/io";

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
  const [selectedRows, setSelectedRows] = useState<Record<number, Artwork>>({});
  const [rowInput, setRowInput] = useState<string>("");
  const [pendingSelectionCount, setPendingSelectionCount] = useState<number>(0);
  const [selectionStartPage, setSelectionStartPage] = useState<number>(1);
  const hasLoadedRef = useRef(false);
  const overlayRef = useRef<OverlayPanel | null>(null);

  const ROWS_PER_PAGE = 12;

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
      try {
        const res = await axios.get(
          `https://api.artic.edu/api/v1/artworks?page=${page}`
        );
        setArtworks(res.data.data);
      } catch (error) {
        console.error("Failed to fetch artworks", error);
      }
    };
    fetchData();
  }, [page]);

  useEffect(() => {
    if (pendingSelectionCount > 0 && artworks.length > 0) {
      const newSelected = { ...selectedRows };

      const rowsAlreadySelected = (page - selectionStartPage) * ROWS_PER_PAGE;

      const rowsToSelectOnThisPage = Math.max(
        0,
        Math.min(pendingSelectionCount - rowsAlreadySelected, artworks.length)
      );

      if (rowsToSelectOnThisPage > 0) {
        artworks.slice(0, rowsToSelectOnThisPage).forEach((artwork) => {
          newSelected[artwork.id] = artwork;
        });
        setSelectedRows(newSelected);
      }

      const totalRowsProcessed = rowsAlreadySelected + artworks.length;
      if (totalRowsProcessed >= pendingSelectionCount) {
        setPendingSelectionCount(0);
      }
    }
    // eslint-disable-next-line
  }, [artworks, pendingSelectionCount]);

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

  const handleSelectRows = () => {
    const count = parseInt(rowInput);

    if (isNaN(count) || count < 0) {
      alert("Please enter a valid number");
      return;
    }

    if (count === 0) {
      alert("Please enter a number greater than 0");
      return;
    }

    setPendingSelectionCount(count);
    setSelectionStartPage(page);

    setRowInput("");
    overlayRef.current?.hide();
  };

  const selectColumnHeader = (options: any) => (
    <div className="flex items-center gap-2">
      {options.headerCheckboxElement}
      <IoMdArrowDropdownCircle
        size={20}
        className="cursor-pointer text-gray-600 hover:text-gray-800"
        onClick={(e) => overlayRef.current?.toggle(e)}
      />
      <OverlayPanel ref={overlayRef}>
        <div className="flex flex-col items-start gap-3 p-3">
          <label htmlFor="rows" className="font-semibold">
            Select Rows
          </label>
          <input
            type="number"
            id="rows"
            className="w-full h-10 border rounded-lg p-2"
            placeholder="Enter number of rows"
            value={rowInput}
            onChange={(e) => setRowInput(e.target.value)}
            min="0"
          />
          <Button onClick={handleSelectRows} className="w-full">
            Submit
          </Button>
        </div>
      </OverlayPanel>
    </div>
  );

  return (
    <div className="min-h-screen w-screen bg-gray-100 flex justify-center items-start p-10">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Artworks Gallery
          </h1>
        </div>

        <DataTable
          value={artworks}
          lazy
          paginator
          rows={ROWS_PER_PAGE}
          selection={currentPageSelection}
          onSelectionChange={handleSelectionChange}
          first={(page - 1) * ROWS_PER_PAGE}
          onPage={(e) => setPage(Math.floor(e.first / e.rows) + 1)}
          selectionMode="checkbox"
          className="text-sm"
        >
          <Column
            header={selectColumnHeader}
            selectionMode="multiple"
            headerStyle={{ width: "6rem" }}
          />
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
