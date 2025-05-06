# 友尽厨房菜品管理系统

这是一个用于管理厨房菜品的系统，支持两种模式：独立运营模式和团队协作模式。

## 功能特点

- 支持两种运营模式：独立运营和团队协作
- 自动3分钟计时功能
- 积分统计和显示
- 成功/失败订单管理
- 美观的用户界面

## 安装说明

### 从GitHub下载

1. 访问 [GitHub Releases](https://github.com/yourusername/dish-management-system/releases)
2. 下载最新版本的Mac应用程序
3. 解压下载的文件
4. 将应用程序拖到Applications文件夹中

### 从源码构建

1. 克隆仓库：
   ```
   git clone https://github.com/yourusername/dish-management-system.git
   cd dish-management-system
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 运行应用：
   ```
   npm start
   ```

4. 构建应用：
   ```
   npm run build
   ```

## 使用说明

### 独立运营模式

1. 启动应用程序
2. 选择"独立运营模式"
3. 点击"上菜"按钮开始处理订单
4. 系统会自动开始3分钟倒计时
5. 完成后点击"成功"或"失败"按钮

### 团队协作模式

1. 启动应用程序
2. 选择"团队协作模式"
3. 点击"上菜"按钮开始处理共享订单
4. 选择分配给A队或B队
5. 系统会自动开始3分钟倒计时
6. 完成后点击"成功"或"失败"按钮

## 开发说明

本项目使用以下技术：

- HTML/CSS/JavaScript
- Electron
- Node.js

## 许可证

MIT 