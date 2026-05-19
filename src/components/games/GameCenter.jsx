import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { FaGamepad, FaTrophy, FaTimes, FaPlay, FaChevronLeft, FaRedo } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const SnakeGame = ({ user, onScoreUpdate }) => {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Game state
    const snakeRef = useRef([{ x: 10, y: 10 }]);
    const foodRef = useRef({ x: 15, y: 15 });
    const dirRef = useRef({ x: 1, y: 0 });
    const gameLoopRef = useRef(null);
    
    const gridSize = 20;
    const tileCount = 20; // 400x400 canvas

    const resetGame = useCallback(() => {
        snakeRef.current = [{ x: 10, y: 10 }];
        foodRef.current = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
        dirRef.current = { x: 1, y: 0 };
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
    }, []);

    const startGame = () => {
        resetGame();
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isPlaying || gameOver) return;
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                    if (dirRef.current.y !== 1) dirRef.current = { x: 0, y: -1 };
                    break;
                case 'ArrowDown':
                case 's':
                    if (dirRef.current.y !== -1) dirRef.current = { x: 0, y: 1 };
                    break;
                case 'ArrowLeft':
                case 'a':
                    if (dirRef.current.x !== 1) dirRef.current = { x: -1, y: 0 };
                    break;
                case 'ArrowRight':
                case 'd':
                    if (dirRef.current.x !== -1) dirRef.current = { x: 1, y: 0 };
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, gameOver]);

    useEffect(() => {
        if (!isPlaying || gameOver) return;

        const ctx = canvasRef.current.getContext('2d');
        
        const gameLoop = setInterval(() => {
            let newSnake = [...snakeRef.current];
            let head = { x: newSnake[0].x + dirRef.current.x, y: newSnake[0].y + dirRef.current.y };

            // Wall Collision
            if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
                handleGameOver(score);
                return;
            }

            // Self Collision
            for (let i = 0; i < newSnake.length; i++) {
                if (newSnake[i].x === head.x && newSnake[i].y === head.y) {
                    handleGameOver(score);
                    return;
                }
            }

            newSnake.unshift(head);

            // Food Collision
            if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
                setScore(s => s + 10);
                foodRef.current = {
                    x: Math.floor(Math.random() * tileCount),
                    y: Math.floor(Math.random() * tileCount)
                };
            } else {
                newSnake.pop();
            }

            snakeRef.current = newSnake;

            // Draw
            ctx.fillStyle = '#0f172a'; // dark background
            ctx.fillRect(0, 0, 400, 400);

            // Draw Food
            ctx.fillStyle = '#ef4444'; // red
            ctx.fillRect(foodRef.current.x * gridSize, foodRef.current.y * gridSize, gridSize - 2, gridSize - 2);

            // Draw Snake
            ctx.fillStyle = '#10b981'; // green
            newSnake.forEach((part, index) => {
                if (index === 0) ctx.fillStyle = '#34d399'; // lighter green for head
                else ctx.fillStyle = '#10b981';
                ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
            });

        }, 100);

        return () => clearInterval(gameLoop);
    }, [isPlaying, gameOver, score]); // depends on score to capture the latest in handleGameOver

    const handleGameOver = async (finalScore) => {
        setGameOver(true);
        setIsPlaying(false);
        if (finalScore > 0) {
            try {
                const res = await api.post('/users/update-score', { username: user.username, score: finalScore });
                if (res.data.isNewHigh) {
                    toast.success(`Kỷ lục mới của bạn: ${finalScore} điểm! 🎉`);
                    onScoreUpdate();
                } else {
                    toast.error(`Game Over! Điểm của bạn: ${finalScore}`);
                }
            } catch (err) {
                console.error("Lỗi cập nhật điểm:", err);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="mb-4 text-center">
                <h3 className="text-2xl font-black text-indigo-400 mb-1">Rắn Săn Mồi</h3>
                <p className="text-gray-400 font-bold">Điểm hiện tại: <span className="text-white">{score}</span></p>
            </div>

            <div className="relative border-4 border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                <canvas 
                    ref={canvasRef} 
                    width={400} 
                    height={400} 
                    className="bg-slate-900 block"
                ></canvas>
                
                {!isPlaying && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                        {gameOver && (
                            <div className="text-center mb-6">
                                <h2 className="text-4xl font-black text-red-500 mb-2">GAME OVER</h2>
                                <p className="text-xl text-white font-bold">Điểm: {score}</p>
                            </div>
                        )}
                        <button 
                            onClick={startGame}
                            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
                        >
                            {gameOver ? <><FaRedo /> Chơi Lại</> : <><FaPlay /> Bắt Đầu Chơi</>}
                        </button>
                        <p className="text-gray-400 mt-4 text-sm font-medium"><kbd className="bg-slate-800 px-2 py-1 rounded">W</kbd> <kbd className="bg-slate-800 px-2 py-1 rounded">A</kbd> <kbd className="bg-slate-800 px-2 py-1 rounded">S</kbd> <kbd className="bg-slate-800 px-2 py-1 rounded">D</kbd> để di chuyển</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const GameCenter = ({ user, onClose }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [activeGame, setActiveGame] = useState(null); // null means showing menu
    const socket = getSocket();

    const fetchLeaderboard = useCallback(async () => {
        try {
            const res = await api.get('/users/leaderboard/top');
            setLeaderboard(res.data);
        } catch (error) {
            console.error("Lỗi tải bảng xếp hạng:", error);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();

        if (socket) {
            socket.on('leaderboard_updated', fetchLeaderboard);
            return () => socket.off('leaderboard_updated', fetchLeaderboard);
        }
    }, [socket, fetchLeaderboard]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-8 animate-fade-in">
            <div className="bg-slate-800 w-full max-w-5xl h-full max-h-[800px] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-700 relative">
                
                {/* Nút Đóng */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 bg-slate-700/50 hover:bg-red-500 text-gray-300 hover:text-white rounded-full flex items-center justify-center z-50 transition-colors"
                >
                    <FaTimes size={20} />
                </button>

                {/* Phần Game Play */}
                <div className="flex-1 bg-slate-900 border-r border-slate-700 flex flex-col relative">
                    {activeGame === 'snake' ? (
                        <>
                            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                                <button 
                                    onClick={() => setActiveGame(null)}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                                >
                                    <FaChevronLeft />
                                </button>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FaGamepad className="text-indigo-400"/> Trung tâm Trò chơi
                                </h2>
                            </div>
                            <div className="flex-1 flex items-center justify-center overflow-auto p-4">
                                <SnakeGame user={user} onScoreUpdate={fetchLeaderboard} />
                            </div>
                        </>
                    ) : (
                        <div className="p-8 h-full flex flex-col">
                            <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                                <FaGamepad className="text-indigo-400 text-4xl"/> Game Center
                            </h2>
                            <p className="text-gray-400 mb-8 font-medium">Giải trí, thi tài cùng bạn bè trên bảng xếp hạng toàn máy chủ.</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Thẻ Game 1 */}
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 hover:border-indigo-500 transition-all group cursor-pointer" onClick={() => setActiveGame('snake')}>
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform">
                                        <span className="text-3xl">🐍</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">Rắn Săn Mồi</h3>
                                    <p className="text-sm text-gray-400 font-medium">Ăn mồi để dài ra và sống sót càng lâu càng tốt. Ghi danh lên bảng vàng!</p>
                                    <button className="mt-4 w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-xl font-bold transition-colors">Chơi Ngay</button>
                                </div>

                                {/* Placeholder cho game 2 */}
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 opacity-60 cursor-not-allowed">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 grayscale">
                                        <span className="text-3xl">❌</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-300 mb-2">Cờ Caro 1vs1</h3>
                                    <p className="text-sm text-gray-500 font-medium">Đang phát triển. Sắp ra mắt!</p>
                                    <button className="mt-4 w-full py-2.5 bg-slate-700 text-gray-400 rounded-xl font-bold" disabled>Sắp Mở</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bảng xếp hạng (Leaderboard) */}
                <div className="w-full md:w-80 bg-slate-800 flex flex-col h-full shrink-0">
                    <div className="p-5 border-b border-slate-700 bg-slate-800/80 sticky top-0 z-10">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <FaTrophy className="text-yellow-400 text-xl"/> Bảng Xếp Hạng
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 font-medium">Vinh danh cao thủ (Top 10)</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {leaderboard.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10 font-medium">Chưa có ai ghi điểm. Hãy là người đầu tiên!</div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {leaderboard.map((lb, idx) => (
                                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${idx === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : idx === 1 ? 'bg-slate-300/10 border border-slate-300/20' : idx === 2 ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-slate-700/50 hover:bg-slate-700'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${idx === 0 ? 'bg-yellow-500 text-yellow-900 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-orange-400 text-orange-900' : 'bg-slate-600 text-gray-300'}`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm text-gray-200 truncate flex items-center gap-1">
                                                {lb.displayName} {lb.username === user.username && <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full ml-1">Bạn</span>}
                                            </div>
                                            <div className="text-xs text-gray-400 truncate">@{lb.username}</div>
                                        </div>
                                        <div className="font-black text-indigo-400">{lb.highScore}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameCenter;
