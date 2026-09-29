import { useState } from 'react';
import { EventBus } from '../../bridge/EventBus';
import { stepIndex } from '../../content/missions/bridgeMission';
import { useT } from '../../i18n';
import { pct } from '../../ml/metrics';
import { useGame } from '../../store/gameStore';
import { Icon } from '../art/Icon';
import { Button } from '../common/Button';
import { describeModel } from '../common/labels';
import { goTo } from '../common/nav';
import { NotYet } from '../common/NotYet';
import { Speech } from '../common/Speech';
import { useTrainResult } from '../common/useTrain';

export function DeployPanel() {
  const t = useT();
  const dp = t.deploy;
  const { mission, discover, completeStep } = useGame();
  const step = mission.step;
  const deployedReq = mission.finalModel ?? mission.deepModel;
  const deep = useTrainResult(step === 'deploy_deep' ? mission.deepModel : deployedReq);
  const [launching, setLaunching] = useState(false);

  if (stepIndex(step) < stepIndex('deploy_deep') || !deployedReq) return <NotYet who="deploy" text={t.notYet.deploy} />;

  if (step === 'deploy_deep') {
    const launch = () => {
      setLaunching(true);
      EventBus.emit('fx:deploy');
      setTimeout(() => {
        discover('deployment');
        completeStep('deploy_deep');
        goTo('monitoring');
      }, 1400);
    };
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Speech who="otto" tone="good">{dp.ottoBrag(deep ? pct(deep.trainMetrics.accuracy) : '…')}</Speech>
        <Speech who="deploy" tone="warn">{dp.ruiDoubt}</Speech>
        <div className="card p-6 text-center space-y-3">
          <div className={`flex justify-center ${launching ? 'animate-bounce' : 'animate-float'}`}><Icon name="package" size={96} /></div>
          <div className="font-display text-2xl font-semibold">{describeModel(t, mission.deepModel!.algorithm, mission.deepModel!.params)}</div>
          <div className="flex justify-center gap-3 text-sm">
            <span className="bg-leaf/10 rounded-lg px-3 py-1 font-bold">{dp.trainLabel(deep ? pct(deep.trainMetrics.accuracy, 1) : '…')}</span>
            <span className="bg-bark/10 rounded-lg px-3 py-1 font-bold flex items-center gap-1"><Icon name="eyeOff" size={16} /> {dp.testNot}</span>
          </div>
          <Button size="lg" variant="coral" onClick={launch} disabled={launching} className="inline-flex items-center gap-2">
            <Icon name="rocket" size={26} /> {launching ? dp.launching : dp.launch}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Speech who="deploy">{mission.finalModel ? dp.fixedLine : dp.ottoLive}</Speech>
      <div className="card p-5 flex items-center gap-4">
        <Icon name="dotGreen" size={40} className="animate-pulse" />
        <div className="flex-1">
          <div className="text-xs font-bold text-bark-soft uppercase">{dp.inProd}</div>
          <div className="font-display text-xl font-semibold">{describeModel(t, deployedReq.algorithm, deployedReq.params)}</div>
        </div>
        <Button variant="sun" onClick={() => goTo('monitoring')} className="flex items-center gap-2"><Icon name="lighthouse" size={22} /> {dp.monitor}</Button>
      </div>
    </div>
  );
}
