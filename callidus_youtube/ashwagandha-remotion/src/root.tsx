import React from 'react';
import {Composition} from 'remotion';
import {AcaciaFiberShort} from './acacia-video';
import {AshwagandhaAffiliateShort} from './video';
import {CallidusWebsitePromo} from './site-promo-video';
import {fisetinDurationInFrames} from './fisetin-copy';
import {FisetinLongevityAd} from './fisetin-video';
import {fisetinDeepDiveDurationInFrames} from './fisetin-deepdive-copy';
import {q10DeepDiveDurationInFrames, nmnDeepDiveDurationInFrames, magnesiumDeepDiveDurationInFrames, vitaminD3K2DeepDiveDurationInFrames, omega3DeepDiveDurationInFrames} from './callidus-batch-deepdive-copy';
import {zinkDeepDiveDurationInFrames, vitaminCDeepDiveDurationInFrames, vitaminBKomplexDeepDiveDurationInFrames, ashwagandhaDeepDiveDurationInFrames, reishiDeepDiveDurationInFrames} from './callidus-next5-deepdive-copy';
import {FisetinEvidenceDeepDive} from './fisetin-deepdive-video';
import {Q10EvidenceDeepDive, NMNEvidenceDeepDive, MagnesiumEvidenceDeepDive, VitaminD3K2EvidenceDeepDive, Omega3EvidenceDeepDive} from './callidus-batch-deepdive-video';
import {ZinkEvidenceDeepDive, VitaminCEvidenceDeepDive, VitaminBKomplexEvidenceDeepDive, AshwagandhaEvidenceDeepDive, ReishiEvidenceDeepDive} from './callidus-next5-deepdive-video';
import {q10DurationInFrames} from './q10-copy';
import {Q10KnowledgeShort} from './q10-video';
import {momusExplainerDurationInFrames} from './momus-explainer-copy';
import {MomusAppExplainer} from './momus-explainer-video';
import {proteinPowerDurationInFrames} from './protein-power-copy';
import {ProteinPowerAdShort} from './protein-power-video';
import {proteinSatireDurationInFrames} from './protein-satire-copy';
import {ProteinSatireKnowledgeShort} from './protein-satire-video';
import {stressResetCourseDurationInFrames} from './stress-reset-course-copy';
import {StressResetCourseAdShort} from './stress-reset-course-video';
import {spermidinDeepDiveDurationInFrames} from './spermidin-deepdive-copy';
import {SpermidinEvidenceDeepDive} from './spermidin-deepdive-video';
import {spermidinDurationInFrames} from './spermidin-copy';
import {SpermidinLongevityInfo} from './spermidin-video';
import {ValusXpSystemPromo} from './valus-xp-video';
import {wmMatchdayDurationInFrames} from './wm-matchday-routine-copy';
import {WorldCupMatchdayRoutineShort} from './wm-matchday-routine-video';
import {WorldCupFocusShort} from './wm-focus-video';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AshwagandhaAffiliateShort"
        component={AshwagandhaAffiliateShort}
        durationInFrames={840}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AcaciaFiberShort"
        component={AcaciaFiberShort}
        durationInFrames={840}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="WorldCupFocusShort"
        component={WorldCupFocusShort}
        durationInFrames={1440}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="WorldCupMatchdayRoutineShort"
        component={WorldCupMatchdayRoutineShort}
        durationInFrames={wmMatchdayDurationInFrames}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="CallidusWebsitePromo"
        component={CallidusWebsitePromo}
        durationInFrames={1440}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ValusXpSystemPromo"
        component={ValusXpSystemPromo}
        durationInFrames={1530}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SpermidinLongevityInfo"
        component={SpermidinLongevityInfo}
        durationInFrames={spermidinDurationInFrames}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SpermidinEvidenceDeepDive"
        component={SpermidinEvidenceDeepDive}
        durationInFrames={spermidinDeepDiveDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FisetinLongevityAd"
        component={FisetinLongevityAd}
        durationInFrames={fisetinDurationInFrames}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FisetinEvidenceDeepDive"
        component={FisetinEvidenceDeepDive}
        durationInFrames={fisetinDeepDiveDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Q10KnowledgeShort"
        component={Q10KnowledgeShort}
        durationInFrames={q10DurationInFrames}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="Q10EvidenceDeepDive"
        component={Q10EvidenceDeepDive}
        durationInFrames={q10DeepDiveDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="NMNEvidenceDeepDive"
        component={NMNEvidenceDeepDive}
        durationInFrames={nmnDeepDiveDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MagnesiumEvidenceDeepDive"
        component={MagnesiumEvidenceDeepDive}
        durationInFrames={magnesiumDeepDiveDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="VitaminD3K2EvidenceDeepDive"
        component={VitaminD3K2EvidenceDeepDive}
        durationInFrames={vitaminD3K2DeepDiveDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Omega3EvidenceDeepDive"
        component={Omega3EvidenceDeepDive}
        durationInFrames={omega3DeepDiveDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="ZinkEvidenceDeepDive"
        component={ZinkEvidenceDeepDive}
        durationInFrames={zinkDeepDiveDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="VitaminCEvidenceDeepDive"
        component={VitaminCEvidenceDeepDive}
        durationInFrames={vitaminCDeepDiveDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="VitaminBKomplexEvidenceDeepDive"
        component={VitaminBKomplexEvidenceDeepDive}
        durationInFrames={vitaminBKomplexDeepDiveDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AshwagandhaEvidenceDeepDive"
        component={AshwagandhaEvidenceDeepDive}
        durationInFrames={ashwagandhaDeepDiveDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ReishiEvidenceDeepDive"
        component={ReishiEvidenceDeepDive}
        durationInFrames={reishiDeepDiveDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MomusAppExplainer"
        component={MomusAppExplainer}
        durationInFrames={momusExplainerDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ProteinPowerAdShort"
        component={ProteinPowerAdShort}
        durationInFrames={proteinPowerDurationInFrames}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="StressResetCourseAdShort"
        component={StressResetCourseAdShort}
        durationInFrames={stressResetCourseDurationInFrames}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ProteinSatireKnowledgeShort"
        component={ProteinSatireKnowledgeShort}
        durationInFrames={proteinSatireDurationInFrames}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
