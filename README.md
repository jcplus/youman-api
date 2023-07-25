# 1. 手机接口

## 1.1 发送验证码到手机号

### 1.1.1 请求方式

`POST /api/phone/code`

### 1.1.2 请求参数

| 参数    | 是否必须 | 类型     | 描述  | 位置           |
|-------|------|--------|-----|--------------|
| phone | 是    | string | 手机号 | Request Body |

示例：

```json
{
  "phone": "13512345678"
}
```

### 1.1.3 响应

| 编号  | 描述      |
|-----|---------|
| 200 | 成功      |
| 400 | 传入参数有问题 |
| 500 | 接口有问题   |

```json
{
  "code": 200
}
```

## 1.2 校验手机收到的验证码

### 1.2.1 请求方式

`POST /api/phone/verify`

### 1.2.2 请求参数

| 参数    | 是否必须 | 类型     | 描述  | 位置           |
|-------|------|--------|-----|--------------|
| phone | 是    | string | 手机号 | Request Body |
| code  | 是    | string | 验证码 | Request Body |

示例：

```json
{
  "phone": "13512345678",
  "code": "1234"
}
```

### 1.2.3 响应

| 编号  | 描述      |
|-----|---------|
| 200 | 成功      |
| 400 | 传入参数有问题 |
| 500 | 接口有问题   |

```json
{
  "code": 200
}
```

## 1.3 校验手机收到的验证码并登录用户

这条请求的规范除了请求网址外和 1.2 几乎完全相同。不同之处在，校验成功后，会登录用户并返回用户 token。

### 1.3.1 请求方式

`POST /api/phone/verify-login`

### 1.3.2 请求参数

同 1.2.2

### 1.3.3 响应

| 编号  | 描述      |
|-----|---------|
| 200 | 成功      |
| 400 | 传入参数有问题 |
| 500 | 接口有问题   |

```json
{
  "token": "xiwncya83jo92nc8eb239c73bc...",
  "code": 200
}
```

# 2. 微信

## 2.1 利用微信登录用户

### 2.1.1 请求方式

`POST /api/wechat/login`

### 2.1.2 参数

| 参数    | 是否必须 | 类型     | 描述  | 位置           |
|-------|------|--------|-----|--------------|
| code  | 是    | string | 登陆code | Request Body |
| pcode | 是    | string | 手机code | Request Body |
| enc   | 否    | string | encryptedData | Request Body |
| iv    | 否    | string | IV            | Request Body |

```json
{
  "code": "0e3srwGa0vknF0aMIa1NUVs1srwGI",
  "pcode": "3648d8b4d3ddc4bc834b32113a61...",
  "enc": "RP+lHe6494+xgdpdqhzt2IkbdOJbuW...",
  "iv": "YMY9rGdOMe4So3RpIEqEg=="
}
```

### 3.3 响应

| 参数      | 类型     | 描述      |
|---------|--------|---------|
| message | string | 验证成功    |
| token   | string | 用户token |

示例：

```json
{
  "message": "验证成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsImlhdCI6MTY4NTYyMDI1MiwiZXhwIjoxNjg4MjEyMjUyfQ.4UkqgEg_SaC1Z_uOJfJyIE43zNkN_2tTEKGFRHzm-zQ",
  "code": 200
}
```

## 4. 获取笔记分类接口

### 4.1 请求方式

`GET /api/post/categories`

### 4.2 参数

无

### 4.3 响应

返回200，包含以下字段：

| 参数   | 类型    | 描述     |
|------|-------|--------|
| data | array | 笔记分类数组 |

示例：

```json
{
  "data": [
	{
	  "id": 1,
	  "name": "头像"
	},
	{
	  "id": 2,
	  "name": "搞笑"
	},
	{
	  "id": 3,
	  "name": "萌宠"
	},
	{
	  "id": 4,
	  "name": "壁纸"
	},
	{
	  "id": 5,
	  "name": "创意"
	}
  ],
  "code": 200
}
```

## 5. 发布笔记接口

### 5.1 请求方式

创建新笔记

`POST /api/post/create`

更新已有笔记

`POST /api/post/create/[笔记ID]`

### 5.2 参数

| 参数           | 是否必须 | 类型      | 描述     |
|--------------|------|---------|--------|
| cover        | 是    | string  | 封面     |
| type         | 是    | integer | 笔记类型   |
| title        | 是    | string  | 标题     |
| content      | 否    | string  | 文字内容   |
| tags         | 否    | array   | 话题     |
| prompt       | 否    | string  | 关键词    |
| price        | 否    | integer | 关键词定价  |
| as_published | 否    | boolean | 是否正式发布 |
| categories   | 否    | array   | 笔记分类ID |
| mentioned    | 否    | array   | 艾特用户   |
| media        | 否    | array   | 媒体     |

示例：

```json
{
  "cover": "",
  "type": 1,
  "title": "Test Post",
  "content": "This is a test post",
  "tags": [
	"tag1",
	"tag2"
  ],
  "prompt": "Prompt for test post",
  "price": 10,
  "as_published": false,
  "categories": [
	1,
	2
  ],
  "mentioned": [
	2,
	3
  ],
  "images": [
	"http://example.com/image1.jpg",
	"http://example.com/image2.jpg"
  ],
  "videos": [
	"http://example.com/video1.mp4"
  ],
  "voices": [
	"http://example.com/voice1.mp3"
  ]
}
```

### 5.3 响应

#### 5.3.1 成功

返回200，包含以下字段：

| 参数   | 类型      | 描述   |
|------|---------|------|
| post | integer | 笔记ID |
| code | integer | 200  |

示例：

```json
{
  "post": 25,
  "code": 200
}
```

## 6. 删除笔记接口

### 6.1 请求方式

`DELETE /api/post/[笔记ID]`

### 6.2 参数

无

### 6.3 响应

返回200，包含以下字段：

| 参数      | 类型      | 描述   |
|---------|---------|------|
| message | string  | 删除成功 |
| code    | integer | 200  |

示例：

```json
{
  "message": "删除成功",
  "code": 200
}
```

## 7. 获取用户自己的笔记接口

### 7.1 请求方式

`GET /api/user/posts/[页码]`

页面不是必须的，但是有的话必须是大于0的整数，不给页码，则默认第一页。

### 7.2 参数

无

### 7.3 响应

| 参数    | 类型      | 描述       |
|-------|---------|----------|
| total | integer | 该用户的笔记总数 |
| page  | integer | 当前页码     |
| posts | array   | 笔记数组     |
| code  | integer | 200      |

```json
{
  "per_page": 10,
  "total": 17,
  "page": 1,
  "posts": [
	{
	  "id": 26,
	  "status": "draft",
	  "post_cover": "https://xxx.com/a.jpg",
	  "post_type": 1,
	  "title": "Test Post",
	  "content": "This is a test post",
	  "prompt": "Prompt for test post",
	  "price": 10,
	  "created_at": "2023-06-03T06:01:28.000Z",
	  "updated_at": "2023-06-03T06:01:28.000Z",
	  "author": {
		"id": 1,
		"avatar": null,
		"name": null
	  },
	  "tags": [
		{
		  "name": "tag2"
		},
		{
		  "name": "tag1"
		}
	  ],
	  "postcategories": [
		{
		  "name": "搞笑"
		},
		{
		  "name": "头像"
		}
	  ],
	  "mentions": [
		{
		  "id": 2,
		  "avatar": null,
		  "name": null
		},
		{
		  "id": 3,
		  "avatar": null,
		  "name": null
		}
	  ],
	  "media": [
		"http://example.com/image1.jpg",
		"http://example.com/image2.jpg",
		"http://example.com/video1.mp4"
	  ]
	}
  ],
  "code": 200
}
```

## 8. 点赞接口

### 8.1 点赞笔记

#### 8.1.1 请求

`POST /api/like/post/[笔记ID]`

| 参数   | 类型      | 描述     |
|------|---------|--------|
| 笔记ID | integer | 被点赞的笔记 |

#### 8.1.2 参数

无

#### 8.1.3 响应

| 参数      | 类型      | 描述   |
|---------|---------|------|
| message | string  | 点赞成功 |
| code    | integer | 200  |

示例

```json
{
  "message": "点赞成功",
  "code": 200
}
```

### 8.2 取消点赞笔记

#### 8.2.1 请求

`DELETE /api/like/post/[笔记ID]`

| 参数   | 类型      | 描述     |
|------|---------|--------|
| 笔记ID | integer | 被点赞的笔记 |

#### 8.2.2 参数

无

#### 8.2.3 响应

| 参数      | 类型      | 描述     |
|---------|---------|--------|
| message | string  | 取消点赞成功 |
| code    | integer | 200    |

示例

```json
{
  "message": "点赞成功",
  "code": 200
}
```

## 9. 关注接口

### 9.1 关注用户

#### 9.1.1 请求

`POST /api/follow/[用户ID]`

| 参数     | 类型      | 描述                   |
|--------|---------|----------------------|
| userId | integer | 要被关注的用户ID（不能是当前用户ID） |

#### 9.1.2 参数

无

#### 9.1.3 响应

| 参数      | 类型      | 描述   |
|---------|---------|------|
| message | string  | 关注成功 |
| code    | integer | 200  |

示例

```json
{
  "message": "关注成功",
  "code": 200
}
```

### 9.2 取消关注用户

#### 9.2.1 请求

`DELETE /api/follow/[用户ID]`

| 参数     | 类型      | 描述                      |
|--------|---------|-------------------------|
| userId | integer | 要被1取消关注的用户ID（不能是当前用户ID） |

#### 9.2.2 参数

无

#### 9.2.3 响应

| 参数      | 类型      | 描述     |
|---------|---------|--------|
| message | string  | 取消关注成功 |
| code    | integer | 200    |

示例

```json
{
  "message": "取消关注成功",
  "code": 200
}
```

### 9.3 获取正在关注的用户列表

#### 9.3.1 请求

`GET /api/follow/following/[页码]`

示例：

`/api/follow/following/` 默认获取第一页

`/api/follow/following/2` 表示获取第二页

| 参数  | 类型      | 描述           |
|-----|---------|--------------|
| 页码  | integer | [可选]不能小于0的整数 |

#### 9.3.2 响应

| 参数   | 类型      | 描述      |
|------|---------|---------|
| data | array   | 关注的用户数组 |
| code | integer | 200     |

```json
{
  "data": [
	{
	  "id": 2,
	  "avatar": null,
	  "name": null
	}
  ],
  "code": 200
}
```

### 9.4 获取粉丝列表

#### 9.4.1 请求

`GET /api/follow/followers/[页码]`

示例：

`/api/follow/followers/` 默认获取第一页

`/api/follow/followers/2` 表示获取第二页

| 参数  | 类型      | 描述           |
|-----|---------|--------------|
| 页码  | integer | [可选]不能小于0的整数 |

#### 9.4.2 响应

| 参数   | 类型      | 描述   |
|------|---------|------|
| data | array   | 粉丝数组 |
| code | integer | 200  |

```json
{
  "data": [
	{
	  "id": 2,
	  "avatar": null,
	  "name": null
	}
  ],
  "code": 200
}
```

### 9.5 获取关注用户总数

#### 9.5.1 请求

`GET /api/follow/followingCount`

#### 9.5.2 响应

| 参数   | 类型      | 描述   |
|------|---------|------|
| data | integer | 关注总数 |

```json
{
  "data": 10,
  "code": 200
}
```

### 9.6 获取粉丝总数

#### 9.6.1 请求

`GET /api/follow/followersCount`

#### 9.6.2 响应

| 参数   | 类型      | 描述   |
|------|---------|------|
| data | integer | 粉丝总数 |

```json
{
  "data": 50,
  "code": 200
}
```

## 10. 评论

### 10.1 笔记评论

#### 10.1.1 请求

`GET /api/comment/post/[笔记ID]/[页码]`

示例：

`/api/comment/post/1/2` 里面的第一个数字 1 是笔记的ID，第二个数字 2 表示第二页，如果是第一页，则第二个数字可以省略也可以写
1。

| 参数   | 类型      | 描述         |
|------|---------|------------|
| 笔记ID | integer | 必须         |
| 页码   | integer | [可选]大于0的整数 |

#### 10.1.2 响应

| 参数       | 类型      | 描述                |
|----------|---------|-------------------|
| total    | integer | 全部评论的数量，不是当前页面的数量 |
| page     | integer | 当前页码              |
| comments | array   | 评论数据              |

```json
{
  "total": 2,
  "page": 1,
  "comments": [
	{
	  "id": 2,
	  "content": "这是一条测试评论",
	  "created_at": "2023-06-06T11:01:41.000Z"
	},
	{
	  "id": 1,
	  "content": "这是一条测试评论",
	  "created_at": "2023-06-06T11:00:38.000Z"
	}
  ]
}
```

### 10.2 发布评论

#### 10.2.1 请求

`POST /api/comment/post/[笔记ID]`

#### 10.2.2 参数

| 参数      | 类型     | 描述     |
|---------|--------|--------|
| content | string | 评论具体内容 |

示例：

```jsonw
{
  "content": "这是一条测试评论"
}
```

#### 10.2.3 响应

| 参数   | 类型      | 描述   |
|------|---------|------|
| data | integer | 评论ID |

示例：

```json
{
  "data": 2,
  "code": 200
}
```

### 10.3 删除评论

#### 10.3.1 请求

`DELETE /api/comment/post/[评论ID]`

#### 10.3.3 响应

成功：

```json
{
  "code": 200
}
```