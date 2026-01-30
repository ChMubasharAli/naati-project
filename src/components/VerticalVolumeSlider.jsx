import Slider from "@mui/material/Slider";

export default function SpotifyVerticalSlider() {
  return (
    <div className="bg-gray-200  h-fit mr-1">
      <Slider
        className="h-12! text-[#006b5e]!"
        aria-label="Temperature"
        orientation="vertical"
        // getAriaValueText={getAriaValueText}
        valueLabelDisplay="auto"
        defaultValue={50}
        size="small"
      />
    </div>
  );
}
