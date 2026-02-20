import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecordButton } from "@/components/record-button";

// Mock motion/react to render plain elements for testing
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { className, style } = props;
      return <div className={className as string} style={style as React.CSSProperties}>{children}</div>;
    },
    button: ({
      children,
      onClick,
      disabled,
      className,
    }: React.PropsWithChildren<{
      onClick?: () => void;
      disabled?: boolean;
      className?: string;
    }>) => (
      <button onClick={onClick} disabled={disabled} className={className}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe("RecordButton", () => {
  it("renders in idle state", () => {
    const onClick = vi.fn();
    render(
      <RecordButton
        isRecording={false}
        isTranscribing={false}
        onClick={onClick}
      />
    );
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(
      <RecordButton
        isRecording={false}
        isTranscribing={false}
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("button is disabled during transcribing", () => {
    const onClick = vi.fn();
    render(
      <RecordButton
        isRecording={false}
        isTranscribing={true}
        onClick={onClick}
      />
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("button is clickable during recording (to stop)", () => {
    const onClick = vi.fn();
    render(
      <RecordButton
        isRecording={true}
        isTranscribing={false}
        onClick={onClick}
      />
    );
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies recording styles when recording", () => {
    render(
      <RecordButton
        isRecording={true}
        isTranscribing={false}
        onClick={vi.fn()}
      />
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-recording");
  });

  it("applies muted styles when transcribing", () => {
    render(
      <RecordButton
        isRecording={false}
        isTranscribing={true}
        onClick={vi.fn()}
      />
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-muted");
    expect(button.className).toContain("cursor-wait");
  });

  it("applies primary styles when idle", () => {
    render(
      <RecordButton
        isRecording={false}
        isTranscribing={false}
        onClick={vi.fn()}
      />
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-primary/10");
  });

  it("handles audioLevel prop", () => {
    // Should not throw with various audio levels
    const { rerender } = render(
      <RecordButton
        isRecording={true}
        isTranscribing={false}
        audioLevel={0}
        onClick={vi.fn()}
      />
    );

    rerender(
      <RecordButton
        isRecording={true}
        isTranscribing={false}
        audioLevel={0.5}
        onClick={vi.fn()}
      />
    );

    rerender(
      <RecordButton
        isRecording={true}
        isTranscribing={false}
        audioLevel={1.0}
        onClick={vi.fn()}
      />
    );
  });

  it("defaults audioLevel to 0", () => {
    // No audioLevel prop — should render without error
    render(
      <RecordButton
        isRecording={true}
        isTranscribing={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
