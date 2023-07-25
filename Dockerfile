# 使用官方提供的node运行时作为一个可信赖的基础
FROM node:14

# 在容器内设置/app目录作为工作目录
WORKDIR /app

# 将依赖描述文件复制到工作目录
COPY package*.json ./

# 安装所有依赖
RUN npm install

# 将项目代码复制到工作目录
COPY . .

# 绑定到容器的公开端口
EXPOSE 3000

# 运行项目
CMD [ "npm", "start" ]
