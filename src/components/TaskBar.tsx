import { useStore } from '../stores/useStore';

export function TaskBar() {
  const { tasks } = useStore();
  const activeTasks = tasks.filter((t) => t.status !== 'completed');

  if (activeTasks.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 md:left-80 p-3 pointer-events-none">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {activeTasks.map((task) => (
          <div
            key={task.id}
            className="flex-shrink-0 bg-gray-900/90 backdrop-blur border border-cyan-900/50 rounded-lg px-4 py-3 min-w-[200px] pointer-events-auto"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs">
                {task.status === 'walking' && '🚶'}
                {task.status === 'working' && '🔧'}
                {task.status === 'pending' && '⏳'}
              </span>
              <span className="text-cyan-300 text-sm font-medium truncate">{task.command}</span>
            </div>
            <div className="text-gray-500 text-xs mb-2">{task.description}</div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div
                className="bg-cyan-500 h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
