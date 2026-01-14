import React from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../../ui/button';
import { Slider } from '../../ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';

interface PlayerControlProps {
  status: number;
  muted: boolean;
  handlePause: any;
  handlePlay: any;
  volumeLevel: number;
  handleVolume: any;
  handleMute: any;
  playerTimeline: number;
  handleTimelineChange: any;
  playerTime: { current: string; remaining: string };
}

const VideoPlayerControls = ({
  status,
  muted,
  handlePause,
  handlePlay,
  volumeLevel,
  handleVolume,
  handleMute,
  playerTimeline,
  handleTimelineChange,
  playerTime,
}: PlayerControlProps): JSX.Element => {
  const [showVolumeSlider, setShowVolumeSlider] = React.useState(false);

  const isPlaying = status === 1;

  const onTimelineChange = (value: number[]) => {
    handleTimelineChange(value[0]);
  };

  const onVolumeChange = (value: number[]) => {
    handleVolume(value[0]);
  };

  return (
    <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
      {/* Timeline Slider */}
      <div className="mb-3">
        <Slider
          value={[playerTimeline]}
          onValueChange={onTimelineChange}
          max={100}
          step={0.1}
          className="cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-white [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-purple-500 [&_.bg-primary]:to-blue-500"
        />
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (isPlaying ? handlePause() : handlePlay())}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPlaying ? 'Pause' : 'Play'}
            </TooltipContent>
          </Tooltip>

          {/* Volume Controls */}
          <div
            className="flex items-center gap-2"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMute}
                  className="h-10 w-10 rounded-full hover:bg-white/10 text-white"
                >
                  {muted || volumeLevel === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {muted ? 'Unmute' : 'Mute'}
              </TooltipContent>
            </Tooltip>

            {/* Volume Slider */}
            <div
              className={`transition-all duration-200 overflow-hidden ${
                showVolumeSlider ? 'w-24 opacity-100' : 'w-0 opacity-0'
              }`}
            >
              <Slider
                value={[muted ? 0 : volumeLevel]}
                onValueChange={onVolumeChange}
                max={100}
                step={1}
                className="cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-white"
              />
            </div>
          </div>

          {/* Time Display */}
          <div className="text-white text-sm font-medium ml-2 flex items-center gap-1">
            <span className="tabular-nums">{playerTime?.current || '00:00'}</span>
            <span className="text-white/50">/</span>
            <span className="tabular-nums text-white/70">{playerTime?.remaining || '00:00'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerControls;
