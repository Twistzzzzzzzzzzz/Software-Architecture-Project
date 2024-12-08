import {Server as SocketIO} from 'socket.io';
import http from 'http';

const PORT = 3001; // Socket.IO 服务器的端口

const server = http.createServer();
const io = new SocketIO(server, {
  cors: {
    origin: "http://localhost:5173", // 前端的地址
    methods: ["GET", "POST"]
  }
});

let rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected');
//监听每个新客户端的连接事件，当有客户端成功连接到服务器时执行此回调
//每个连接的客户端都会分配一个唯一的socket对象，用于和该客户端进行通信
  // 创建房间
  socket.on('createRoom', (roomId) => {
    //监听客户端发送的createRoom事件，当客户端请求创建一个房间时执行该回调
    if (!rooms[roomId]) {// 如果房间不存在
      rooms[roomId] = {players: [], questions: [], answers: {}, readyCount: 0, timer: null};
      //初始化房间信息:房间内玩家ID列表，问题数据，玩家答案，玩家数量，倒计时
      socket.join(roomId);
      console.log(`Room ${roomId} created`);
      socket.emit('roomCreated', roomId);
    } else {
      socket.emit('error', 'Room already exists');
    }
  });

  // 加入房间
  socket.on('joinRoom', (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].players.push(socket.id);//player是存储房间内玩家ID的数组
      socket.join(roomId); //将客户端加入房间
      console.log(`Player ${socket.id} joined room ${roomId}`);
      io.to(roomId).emit('playerJoined', roomId);
    } else {
      socket.emit('error', 'Room does not exist');
    }
  });

  // 玩家准备开始游戏
  socket.on('startGame', async (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].readyCount += 1;

      if (rooms[roomId].readyCount === 2) {
        io.to(roomId).emit('gameStarted');
        rooms[roomId].readyCount = 0; // 重置准备计数
      }
    } else {
      socket.emit('error', 'Room does not exist');
    }
  });

  socket.on('getQuestions',  async (roomId) => {
    const quizzes = await getQuizzesFromDatabase();
    rooms[roomId].questions = quizzes;
    io.emit('questions', quizzes);
  });


  // 提交答案
  socket.on('submitAnswer', (roomId, answer) => {
    rooms[roomId].answers[socket.id] = answer;
    io.to(roomId).emit('answerSubmitted', {playerId: socket.id, answer});
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// 启动计时器函数
function startTimer(roomId) {
  let countdown = 30; // 30秒倒计时
  rooms[roomId].timer = setInterval(() => {
    if (countdown > 0) {
      countdown--;
      io.to(roomId).emit('timer', countdown); // 每秒发送剩余时间
    } else {
      clearInterval(rooms[roomId].timer);
      io.to(roomId).emit('timeUp'); // 时间到事件
    }
  }, 1000);
}

// 启动 Socket.IO 服务器
server.listen(PORT, () => {
  console.log(`Socket.IO server is running on http://localhost:${PORT}`);
});

// 模拟获取题目数据的函数
async function
getQuizzesFromDatabase() {
  return [
    {
      question: "I have cities, but no houses. I have forests, but no trees. I have rivers, but no water. What am I?",
      options: ["A map", "A dream", "A movie", "A painting"],
      answer: "A map"
    },

    {
      question: "The more you take, the more you leave behind. What am I?",
      options: ["Time", "Footsteps", "Memory", "Holes"],
      answer: "Footsteps"
    },

    {
      question: "What comes once in a minute, twice in a moment, but never in a thousand years?",
      options: ["The letter 'M'", "A star", "An eclipse", "A century"],
      answer: "The letter 'M'"
    },

    {
      question: "What has keys but can't open locks?",
      options: ["A piano", "A map", "A computer", "A treasure chest"],
      answer: "A piano"
    },

    {
      question: "If two’s company and three’s a crowd, what are four and five?",
      options: ["A party", "Nine", "A team", "A band"],
      answer: "Nine"
    },

    {
      question: "What is so fragile that saying its name breaks it?",
      options: ["Silence", "Glass", "Love", "Trust"],
      answer: "Silence"
    },

    {
      question: "What is always in front of you but can’t be seen?",
      options: ["The future", "Air", "Time", "A mirror"],
      answer: "The future"
    },

    {
      question: "I am not alive, but I grow; I don’t have lungs, but I need air; I don’t have a mouth, but water kills me. What am I?",
      options: ["Fire", "Clouds", "A plant", "A shadow"],
      answer: "Fire"
    },

    {
      question: "What can travel around the world while staying in the corner?",
      options: ["A stamp", "A clock", "A letter", "A satellite"],
      answer: "A stamp"
    },

    {
      question: "What has a head, a tail, but no body?",
      options: ["A coin", "A snake", "A shadow", "A comet"],
      answer: "A coin"
    }
  ];
}