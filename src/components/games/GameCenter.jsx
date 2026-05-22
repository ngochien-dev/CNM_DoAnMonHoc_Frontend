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
                const res = await api.post('/users/update-score', { username: user.username, score: finalScore, gameId: 'snake' });
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
                <h3 className="text-xl font-bold text-indigo-500 mb-1">Rắn Săn Mồi</h3>
                <p className="text-gray-500 font-semibold text-sm">Điểm hiện tại: <span className="text-slate-800 dark:text-white">{score}</span></p>
            </div>

            <div className="relative border-4 border-slate-700 rounded-xl overflow-hidden shadow-lg">
                <canvas 
                    ref={canvasRef} 
                    width={400} 
                    height={400} 
                    className="bg-slate-900 block"
                ></canvas>
                
                {!isPlaying && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                        {gameOver && (
                            <div className="text-center mb-6">
                                <h2 className="text-3xl font-bold text-red-400 mb-2">Trò Chơi Kết Thúc</h2>
                                <p className="text-lg text-white font-medium">Điểm của bạn: {score}</p>
                            </div>
                        )}
                        <button 
                            onClick={startGame}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm"
                        >
                            {gameOver ? <><FaRedo /> Chơi lại</> : <><FaPlay /> Bắt đầu chơi</>}
                        </button>
                        <p className="text-gray-400 mt-4 text-sm font-medium"><kbd className="bg-slate-800 px-2 py-1 rounded">W</kbd> <kbd className="bg-slate-800 px-2 py-1 rounded">A</kbd> <kbd className="bg-slate-800 px-2 py-1 rounded">S</kbd> <kbd className="bg-slate-800 px-2 py-1 rounded">D</kbd> để di chuyển</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const FlappyBird = ({ user, onScoreUpdate }) => {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Game state
    const bird = useRef({ y: 200, velocity: 0, gravity: 0.6, jump: -8, size: 20 });
    const pipes = useRef([]);
    const frame = useRef(0);
    const pipeWidth = 50;
    const gap = 120;

    const resetGame = useCallback(() => {
        bird.current = { y: 200, velocity: 0, gravity: 0.6, jump: -8, size: 20 };
        pipes.current = [];
        frame.current = 0;
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
    }, []);

    const startGame = () => {
        resetGame();
    };

    const handleJump = useCallback((e) => {
        if (!isPlaying || gameOver) return;
        if (e.type === 'keydown' && e.code !== 'Space' && e.key !== 'ArrowUp') return;
        bird.current.velocity = bird.current.jump;
    }, [isPlaying, gameOver]);

    useEffect(() => {
        window.addEventListener('keydown', handleJump);
        return () => window.removeEventListener('keydown', handleJump);
    }, [handleJump]);

    useEffect(() => {
        if (!isPlaying || gameOver) return;
        const ctx = canvasRef.current.getContext('2d');
        let animationId;

        const loop = () => {
            frame.current++;
            const b = bird.current;

            // Physics
            b.velocity += b.gravity;
            b.y += b.velocity;

            // Collision with floor/ceiling
            if (b.y + b.size >= 400 || b.y <= 0) {
                handleGameOver(score);
                return;
            }

            // Pipes generating
            if (frame.current % 90 === 0) {
                const pipeY = Math.random() * (400 - gap - 40) + 20; // 20 to 240
                pipes.current.push({ x: 400, y: pipeY, passed: false });
            }

            // Move pipes & Collision
            let isDead = false;
            pipes.current.forEach(p => {
                p.x -= 3;
                
                // Collision
                if (
                    50 < p.x + pipeWidth && 
                    50 + b.size > p.x && 
                    (b.y < p.y || b.y + b.size > p.y + gap)
                ) {
                    isDead = true;
                }

                // Score (Bird X is 50)
                if (p.x + pipeWidth < 50 && !p.passed) {
                    setScore(s => s + 10);
                    p.passed = true;
                }
            });

            if (isDead) {
                handleGameOver(score);
                return;
            }

            // Clean off-screen pipes
            pipes.current = pipes.current.filter(p => p.x + pipeWidth > 0);

            // Draw
            ctx.fillStyle = '#38bdf8'; // Sky blue
            ctx.fillRect(0, 0, 400, 400);

            // Draw pipes
            ctx.fillStyle = '#22c55e'; // Green
            pipes.current.forEach(p => {
                ctx.fillRect(p.x, 0, pipeWidth, p.y); // top pipe
                ctx.fillRect(p.x, p.y + gap, pipeWidth, 400 - (p.y + gap)); // bottom pipe
                // borders
                ctx.fillStyle = '#166534';
                ctx.fillRect(p.x - 2, p.y - 20, pipeWidth + 4, 20); // top cap
                ctx.fillRect(p.x - 2, p.y + gap, pipeWidth + 4, 20); // bottom cap
                ctx.fillStyle = '#22c55e';
            });

            // Draw Bird
            ctx.fillStyle = '#facc15'; // Yellow
            ctx.beginPath();
            ctx.arc(50 + b.size/2, b.y + b.size/2, b.size/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Bird Eye
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(50 + b.size/2 + 4, b.y + b.size/2 - 4, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(50 + b.size/2 + 5, b.y + b.size/2 - 4, 2, 0, Math.PI * 2);
            ctx.fill();

            animationId = requestAnimationFrame(loop);
        };

        animationId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationId);
    }, [isPlaying, gameOver, score]);

    const handleGameOver = async (finalScore) => {
        setGameOver(true);
        setIsPlaying(false);
        if (finalScore > 0) {
            try {
                const res = await api.post('/users/update-score', { username: user.username, score: finalScore, gameId: 'flappy' });
                if (res.data.isNewHigh) {
                    toast.success(`Kỷ lục mới của bạn: ${finalScore} điểm! 🎉`);
                    onScoreUpdate();
                } else {
                    toast.error(`Game Over! Điểm của bạn: ${finalScore}`);
                }
            } catch (err) {}
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="mb-4 text-center">
                <h3 className="text-xl font-bold text-sky-500 mb-1">Chim Bay (Flappy)</h3>
                <p className="text-gray-500 font-semibold text-sm">Điểm hiện tại: <span className="text-slate-800 dark:text-white">{score}</span></p>
            </div>
            <div className="relative border-4 border-slate-700 rounded-xl overflow-hidden shadow-lg select-none" onClick={handleJump}>
                <canvas ref={canvasRef} width={400} height={400} className="bg-sky-400 block cursor-pointer"></canvas>
                {!isPlaying && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                        {gameOver && (
                            <div className="text-center mb-6">
                                <h2 className="text-3xl font-bold text-red-400 mb-2">Trò Chơi Kết Thúc</h2>
                                <p className="text-lg text-white font-medium">Điểm của bạn: {score}</p>
                            </div>
                        )}
                        <button onClick={startGame} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm">
                            {gameOver ? <><FaRedo /> Chơi lại</> : <><FaPlay /> Bắt đầu chơi</>}
                        </button>
                        <p className="text-gray-300 mt-4 text-sm font-medium">Nhấn <kbd className="bg-slate-800 px-2 py-1 rounded border border-gray-600">Space</kbd> hoặc Click để bay</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const GameCenter = ({ user, onClose, darkMode }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [activeGame, setActiveGame] = useState(null); // null means showing menu
    const [lbTab, setLbTab] = useState('snake');
    const socket = getSocket();

    const fetchLeaderboard = useCallback(async (gameId = lbTab) => {
        try {
            const res = await api.get(`/users/leaderboard/top?gameId=${gameId}`);
            setLeaderboard(res.data);
        } catch (error) {
            console.error("Lỗi tải bảng xếp hạng:", error);
        }
    }, [lbTab]);

    useEffect(() => {
        if (activeGame) {
            setLbTab(activeGame);
        }
    }, [activeGame]);

    useEffect(() => {
        fetchLeaderboard(lbTab);

        if (socket) {
            const handler = (data) => {
                if (data && data.gameId === lbTab) {
                    fetchLeaderboard(lbTab);
                } else if (!data) { // fallback
                    fetchLeaderboard(lbTab);
                }
            };
            socket.on('leaderboard_updated', handler);
            return () => socket.off('leaderboard_updated', handler);
        }
    }, [socket, fetchLeaderboard, lbTab]);

    return (
        <div className={`flex-1 flex flex-col md:flex-row h-full overflow-hidden select-none transition-colors duration-300 font-sans ${
            darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'
        }`}>
            {/* Game Screen Column */}
            <div className={`flex-1 flex flex-col relative ${
                darkMode ? 'bg-[#0f172a] border-white/10' : 'bg-white border-gray-200'
            } border-r`}>
                


                {/* Phần Game Play */}
                <div className="flex-1 flex flex-col relative h-full">
                    {activeGame !== null ? (
                        <>
                            <div className={`p-4 border-b ${
                                darkMode ? 'border-white/10' : 'border-gray-200'
                            } flex items-center gap-3`}>
                                <button 
                                    onClick={() => setActiveGame(null)}
                                    className={`p-2 ${
                                        darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-slate-600'
                                    } rounded-lg transition-colors`}
                                    title="Quay lại danh sách game"
                                >
                                    <FaChevronLeft />
                                </button>
                                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'} flex items-center gap-2`}>
                                    <FaGamepad className="text-indigo-500"/> Trung tâm Trò chơi
                                </h2>
                            </div>
                            <div className="flex-1 flex items-center justify-center overflow-auto p-4">
                                {activeGame === 'snake' && <SnakeGame user={user} onScoreUpdate={fetchLeaderboard} />}
                                {activeGame === 'flappy' && <FlappyBird user={user} onScoreUpdate={fetchLeaderboard} />}
                            </div>
                        </>
                    ) : (
                        <div className="p-8 h-full flex flex-col justify-center overflow-y-auto">
                            <div className="max-w-3xl mx-auto w-full">
                                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-2 flex items-center gap-3`}>
                                    <FaGamepad className="text-indigo-600"/> Game Center
                                </h2>
                                <p className={`mb-8 font-medium text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Giải trí, thi tài cùng bạn bè trên bảng xếp hạng toàn máy chủ.</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Thẻ Game 1 */}
                                    <div className={`border rounded-2xl p-6 transition-all group cursor-pointer shadow-sm hover:shadow-md ${
                                        darkMode ? 'bg-[#1e293b] border-white/10 hover:border-indigo-500/50' : 'bg-white border-gray-200 hover:border-indigo-300'
                                    }`} onClick={() => setActiveGame('snake')}>
                                        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1">
                                            <span className="text-2xl">🐍</span>
                                        </div>
                                        <h3 className={`text-lg font-bold mb-2 transition-colors ${darkMode ? 'text-white group-hover:text-indigo-400' : 'text-slate-800 group-hover:text-indigo-600'}`}>Rắn Săn Mồi</h3>
                                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ăn mồi để dài ra và sống sót càng lâu càng tốt. Ghi danh lên bảng vàng!</p>
                                        <button className="mt-5 w-full py-2.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 rounded-xl font-semibold transition-colors text-sm">Chơi ngay</button>
                                    </div>

                                    {/* Thẻ Game 2 */}
                                    <div className={`border rounded-2xl p-6 transition-all group cursor-pointer shadow-sm hover:shadow-md ${
                                        darkMode ? 'bg-[#1e293b] border-white/10 hover:border-sky-500/50' : 'bg-white border-gray-200 hover:border-sky-300'
                                    }`} onClick={() => setActiveGame('flappy')}>
                                        <div className="w-14 h-14 bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1">
                                            <span className="text-2xl">🦅</span>
                                        </div>
                                        <h3 className={`text-lg font-bold mb-2 transition-colors ${darkMode ? 'text-white group-hover:text-sky-400' : 'text-slate-800 group-hover:text-sky-600'}`}>Chim Bay (Flappy)</h3>
                                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nhấn Space để bay qua các ống nước. Cực kỳ ức chế và dễ nghiện!</p>
                                        <button className="mt-5 w-full py-2.5 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-500 hover:text-white text-sky-600 dark:text-sky-400 rounded-xl font-semibold transition-colors text-sm">Chơi ngay</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bảng xếp hạng (Leaderboard) */}
            <div className={`w-full md:w-80 flex flex-col h-full shrink-0 border-l ${darkMode ? 'bg-[#0f172a] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`p-5 border-b ${darkMode ? 'border-white/10 bg-[#0f172a]' : 'border-gray-200 bg-white'} sticky top-0 z-10 flex flex-col gap-4`}>
                    <div className="flex items-center justify-between">
                        <h3 className={`text-base font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            <FaTrophy className="text-yellow-500"/> {lbTab === 'snake' ? 'BXH Rắn Săn Mồi' : 'BXH Chim Bay'}
                        </h3>
                        <p className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Top 10</p>
                    </div>
                    {activeGame === null && (
                        <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <button 
                                onClick={() => setLbTab('snake')}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${lbTab === 'snake' ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-gray-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white'}`}
                            >
                                🐍 Rắn Săn Mồi
                            </button>
                            <button 
                                onClick={() => setLbTab('flappy')}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${lbTab === 'flappy' ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-gray-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white'}`}
                            >
                                🦅 Chim Bay
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {leaderboard.length === 0 ? (
                        <div className={`text-center mt-10 font-semibold text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Chưa có thành tích nào!</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {leaderboard.map((lb, idx) => (
                                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                                    idx === 0 
                                        ? (darkMode ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200') 
                                        : idx === 1 
                                            ? (darkMode ? 'bg-slate-400/10 border-slate-400/20' : 'bg-slate-100 border-slate-200') 
                                            : idx === 2 
                                                ? (darkMode ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-200') 
                                                : (darkMode ? 'bg-white/5 border-transparent hover:bg-white/10' : 'bg-white border-gray-100 shadow-sm hover:border-gray-200')
                                }`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                        idx === 0 
                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-500' 
                                            : idx === 1 
                                                ? 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300' 
                                                : idx === 2 
                                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-500' 
                                                    : (darkMode ? 'bg-slate-800 text-gray-400' : 'bg-gray-100 text-gray-500')
                                    }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-semibold text-sm truncate flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                            {lb.displayName} {lb.username === user.username && <span className="text-[10px] bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold">Bạn</span>}
                                        </div>
                                        <div className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>@{lb.username}</div>
                                    </div>
                                    <div className={`font-bold text-sm ${idx === 0 ? 'text-yellow-600 dark:text-yellow-400' : idx === 1 ? 'text-slate-600 dark:text-slate-400' : idx === 2 ? 'text-orange-600 dark:text-orange-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{lb.score}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameCenter;
