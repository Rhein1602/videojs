-- phpMyAdmin SQL Dump
-- version 4.4.15.10
-- https://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: 2020-12-08 22:27:07
-- 服务器版本： 5.6.49-log
-- PHP Version: 5.6.40

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `qunzhi`
--

-- --------------------------------------------------------

--
-- 表的结构 `video`
--

CREATE TABLE IF NOT EXISTS `video` (
  `id` int(255) NOT NULL,
  `name` text NOT NULL,
  `Introduction` text NOT NULL,
  `number` int(255) NOT NULL,
  `imgpath` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `video`
--

INSERT INTO `video` (`id`, `name`, `Introduction`, `number`, `imgpath`) VALUES
(1, 'Iron Man', 'this is iron man', 3, 'Iron Man.png'),
(2, 'leap', 'this is leap', 1, 'leap.png'),
(3, '八百', '八百', 1, 'eight.png');

-- --------------------------------------------------------

--
-- 表的结构 `videolist`
--

CREATE TABLE IF NOT EXISTS `videolist` (
  `title` text NOT NULL,
  `imgpath` text NOT NULL,
  `id` int(255) NOT NULL,
  `Introduction` text NOT NULL,
  `showID` int(255) NOT NULL,
  `videoid` int(255) NOT NULL,
  `videoname` text NOT NULL,
  `videopath` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `videolist`
--

INSERT INTO `videolist` (`title`, `imgpath`, `id`, `Introduction`, `showID`, `videoid`, `videoname`, `videopath`) VALUES
('Iron Man 1', 'Iron Man/Iron Man1.png', 1, 'Iron Man 1', 1, 1, 'Iron Man', '1.mp4'),
('Iron Man 2', 'Iron Man/Iron Man2.png', 2, 'Iron Man 2', 2, 1, 'Iron Man', '2.mp4'),
('Iron Man 3', 'Iron Man/Iron Man3.png', 3, 'Iron Man 3', 3, 1, 'Iron Man', '3.mp4');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `video`
--
ALTER TABLE `video`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `videolist`
--
ALTER TABLE `videolist`
  ADD PRIMARY KEY (`id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
