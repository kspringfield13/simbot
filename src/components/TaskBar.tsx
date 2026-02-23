import { useStore } from '../stores/useStore';

export function TaskBar() {
  const { tasks } = useStore();
  const activeTasks = tasks.filter((t) => t.status !== 'completed');

  if (activeTasks.length === 0) return null;

  return (
    <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {activeTasks.map((task) => (
          <div
            key={task.id}
            className="flex-shrink-0 bg-black/50 backdrop-blur-md border border-white/8 rounded-xl px-4 py-3 min-w-[180px] pointer-events-auto"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs">
                {task.status === 'walking' && '🚶'}
                {task.status === 'working' && '⚡'}
                {task.status === 'pending' && '⏳'}
              </span>
              <span className="text-white/80 text-sm font-medium truncate">{task.command}</span>
            </div>
            <div className="text-white/30 text-[10px] mb-2 truncate">{task.description}</div>
            <div className="w-full bg-white/5 rounded-full h-1">
              <div
                className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-1 rounded-full transition-all duration-200"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
