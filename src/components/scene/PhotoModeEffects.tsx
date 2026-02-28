import { DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing';
import { useStore } from '../../stores/useStore';

export function PhotoModeEffects() {
  const photoMode = useStore((s) => s.photoMode);

  if (!photoMode) return null;

  return (
    <EffectComposer>
      <DepthOfField
        focusDistance={0.01}
        focalLength={0.06}
        bokehScale={5}
      />
      <Vignette offset={0.3} darkness={0.6} />
    </EffectComposer>
  );
}
