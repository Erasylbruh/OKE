import { useAudio } from '../context/AudioContext';
import { FaPlay, FaPause, FaHeart, FaComment, FaShare } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ProjectCard = ({ project }) => {
    const { playTrack, currentTrackId, isPlaying } = useAudio();
    const navigate = useNavigate();

    // Check if THIS project is the one playing
    const isCurrent = currentTrackId === project.id;
    const isThisPlaying = isCurrent && isPlaying;

    const handlePlayClick = (e) => {
        e.stopPropagation();
        if (project.preview_url) {
            playTrack(project.preview_url, project.id);
        }
    };

    const handleCardClick = () => {
        navigate(`/project/${project.id}`);
    };

    // Fallback image if preview_urls is empty or preview_url is null
    // Use project.preview_url (legacy/main) or first from array
    // Or placeholder
    const imageUrl = project.preview_url || (project.preview_urls && project.preview_urls[0]) || 'https://via.placeholder.com/400x400?text=No+Cover';

    // Check for array to display secondary images if needed, but for card main image is enough.

    return (
        <div
            onClick={handleCardClick}
            className="flex items-center gap-5 p-4 min-h-[120px] bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 transition-all cursor-pointer group hover:border-neutral-700"
        >
            <div className="relative w-24 h-24 shrink-0">
                {/* Vinyl animation container */}
                <div className={`w-full h-full rounded-full overflow-hidden shadow-lg border-2 border-neutral-800 group-hover:border-neutral-600 transition-colors ${isThisPlaying ? 'animate-spin-slow' : ''}`}>
                    <img
                        src={imageUrl}
                        className="w-full h-full object-cover"
                        alt={project.name}
                    />
                </div>

                {/* Play Button Overlay */}
                <button
                    onClick={handlePlayClick}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full z-10"
                >
                    {isThisPlaying ? <FaPause className="text-white text-xl" /> : <FaPlay className="text-white text-xl ml-1" />}
                </button>
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors">{project.name}</h3>
                <div className="text-sm text-neutral-400 truncate mt-1">
                    {project.nickname || project.username || 'Unknown Artist'}
                </div>

                <div className="flex items-center gap-4 mt-3 text-neutral-500 text-sm">
                    <div className="flex items-center gap-1 hover:text-red-500 transition-colors">
                        <FaHeart />
                        <span>{project.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                        <FaComment />
                        <span>{project.comments_count || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
