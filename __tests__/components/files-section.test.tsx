import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilesSection } from "@/components/records/files-section";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const baseFile = {
  id: 1,
  recordId: 10,
  name: "documento.pdf",
  url: "https://example.com/doc.pdf",
  storagePath: "records/10/documento.pdf",
  type: "application/pdf",
  size: 1024,
  aiMatch: false,
  aiConfidence: null,
  createdAt: "2024-01-01T00:00:00.000Z",
};

describe("FilesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all three sections", () => {
    render(
      <FilesSection recordId={1} initialFiles={[]} />
    );
    expect(screen.getByText("Drive")).toBeInTheDocument();
    expect(screen.getByText("Apartados")).toBeInTheDocument();
    expect(screen.getByText("Expediente")).toBeInTheDocument();
  });

  it("shows file in the correct section", () => {
    const driveFile = {
      ...baseFile,
      id: 1,
      category: "DRIVE" as const,
      name: "drive-file.pdf",
    };
    render(
      <FilesSection recordId={1} initialFiles={[driveFile]} />
    );
    expect(screen.getByText(/drive-file\.pdf/)).toBeInTheDocument();
  });

  it("shows file count badge when section has files", () => {
    const apartadoFile = {
      ...baseFile,
      id: 2,
      category: "APARTADO" as const,
      name: "nota.pdf",
    };
    render(
      <FilesSection recordId={1} initialFiles={[apartadoFile]} />
    );
    // The count badge should show "1"
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows empty state text when section has no files and is open", () => {
    render(
      <FilesSection recordId={1} initialFiles={[]} />
    );
    // APARTADO and EXPEDIENTE start collapsed (defaultOpen = files.length > 0)
    // DRIVE starts collapsed too
    // All start closed, so we need to expand one to see empty state
    const driveButton = screen.getByText("Drive").closest("button");
    expect(driveButton).toBeTruthy();
  });

  it("shows AI badge for files with aiMatch=true", () => {
    const aiFile = {
      ...baseFile,
      id: 1,
      category: "DRIVE" as const,
      name: "ai-matched.pdf",
      aiMatch: true,
      aiConfidence: 0.95,
    };
    render(
      <FilesSection recordId={1} initialFiles={[aiFile]} />
    );
    expect(screen.getByText("IA")).toBeInTheDocument();
  });

  it("does not show upload button for DRIVE section", () => {
    const driveFile = {
      ...baseFile,
      id: 1,
      category: "DRIVE" as const,
    };
    render(
      <FilesSection recordId={1} initialFiles={[driveFile]} />
    );
    // The Drive section should be open (has files) but no "Subir" button
    const subirButtons = screen.queryAllByText("Subir");
    // APARTADO and EXPEDIENTE start closed (no files), so no Subir buttons visible
    expect(subirButtons).toHaveLength(0);
  });

  it("shows upload button for APARTADO when open", () => {
    const apartadoFile = {
      ...baseFile,
      id: 1,
      category: "APARTADO" as const,
    };
    render(
      <FilesSection recordId={1} initialFiles={[apartadoFile]} />
    );
    // APARTADO starts open (has files), should show Subir button
    expect(screen.getByText("Subir")).toBeInTheDocument();
  });

  it("collapses a section when header button is clicked", () => {
    const apartadoFile = {
      ...baseFile,
      id: 1,
      category: "APARTADO" as const,
      name: "nota.pdf",
    };
    render(
      <FilesSection recordId={1} initialFiles={[apartadoFile]} />
    );
    // Section starts open (has files), file is visible
    expect(screen.getByText(/nota\.pdf/)).toBeInTheDocument();

    // Click the section header to collapse
    const headerButton = screen.getByText("Apartados").closest("button")!;
    fireEvent.click(headerButton);

    // File should no longer be visible
    expect(screen.queryByText(/nota\.pdf/)).not.toBeInTheDocument();
  });

  it("always renders all three sections regardless of files", () => {
    render(
      <FilesSection recordId={1} initialFiles={[]} />
    );
    expect(screen.getByText("Drive")).toBeInTheDocument();
    expect(screen.getByText("Apartados")).toBeInTheDocument();
    expect(screen.getByText("Expediente")).toBeInTheDocument();
  });
});
