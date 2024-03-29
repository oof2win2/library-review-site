import {
	Button,
	ButtonGroup,
	Flex,
	Heading,
	IconButton,
	useColorMode,
	useColorModeValue,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalCloseButton,
	Input,
	Stack,
	Text,
} from "@chakra-ui/react"
import {
	HamburgerIcon,
	CloseIcon,
	MoonIcon,
	SunIcon,
	SearchIcon,
} from "@chakra-ui/icons"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useUserStore } from "@/utils/zustand"
import { UserAuthLevel, SearchBookType } from "@/utils/types"
import { useDebounce } from "use-debounce"
import { meiliSearchClient } from "@/utils/meilisearch/client"
import Image from "next/image"

type Page = {
	type: "page"
	title: string
	href: string
}

const initialPages: Page[] = [
	{
		type: "page",
		title: "Home",
		href: "/",
	},
]

const LoggedOut: Page[] = [
	{
		type: "page",
		title: "Sign Up",
		href: "/user/signup",
	},
	{
		type: "page",
		title: "Login",
		href: "/user/login",
	},
]
const LoggedIn: Page[] = [
	{
		type: "page",
		title: "Logout",
		href: "/user/logout",
	},
]
const AdminPanel: Page = {
	type: "page",
	title: "Admin Panel",
	href: "/admin",
}

const Navbar = () => {
	const [mobileIsOpen, setMobileIsOpen] = useState(false)
	const { colorMode, toggleColorMode } = useColorMode()
	const isDark = colorMode === "dark"
	const user = useUserStore((store) => store.user)
	const [searchIsOpen, setSearchIsOpen] = useState(false)
	const [currentSearchTerm, setCurrentSearchTerm] = useState("")
	const [searchTerm] = useDebounce(currentSearchTerm, 200)
	const bookIndex = meiliSearchClient.index("book")
	const [searchResults, setSearchResults] = useState<SearchBookType[]>([])
	const borderColor = useColorModeValue("gray.200", "gray.700")
	const [pages, setPages] = useState<Page[]>([])

	useEffect(() => {
		const run = async () => {
			if (searchTerm) {
				const data = await bookIndex.search(searchTerm)
				setSearchResults(data.hits as SearchBookType[])
			} else {
				setSearchResults([])
			}
		}
		run()
	}, [searchTerm])

	useEffect(() => {
		const pg: Page[] = [...initialPages]
		if (user) {
			if (user.authLevel === UserAuthLevel.Admin) {
				pg.push(AdminPanel)
			}

			pg.push(...LoggedIn)
		} else {
			pg.push(...LoggedOut)
		}
		setPages(pg)
	}, [user])

	return (
		<Flex alignItems="center" width="100%" padding="20px 10px 20px 10px">
			<Link href="/">
				<Heading whiteSpace="nowrap" paddingLeft="4px" size="md">
					Bookaholic Blurbs
				</Heading>
			</Link>

			{/* search modal */}
			<Modal isOpen={searchIsOpen} onClose={() => setSearchIsOpen(false)}>
				<ModalOverlay />
				<ModalContent p={2}>
					<ModalHeader>Book Search</ModalHeader>
					<ModalCloseButton />
					<Input
						placeholder="Search"
						onChange={(e) => setCurrentSearchTerm(e.target.value)}
						autoFocus={true}
					/>
					<Stack>
						{searchResults.slice(0, 10).map((book) => (
							<Link
								href={`/reviews/${book.isbn}`}
								key={book.isbn}
								onClick={() => setSearchIsOpen(false)}
							>
								<Flex
									alignItems="center"
									justifyContent="space-between"
									padding="10px"
									border="1px solid"
									borderColor={borderColor}
									borderRadius="md"
								>
									<Flex alignItems="center">
										<Image
											src={
												book.smallThumbnail ??
												book.largeThumbnail ??
												""
											}
											alt={book.title}
											width="50"
											height="50"
										/>
										<Flex
											flexDirection="column"
											marginLeft="10px"
										>
											<Heading size="sm">
												{book.title}
											</Heading>
											<Heading size="xs">
												{book.subtitle}
											</Heading>
											<Text size="xs">
												{book.authors}
											</Text>
											<Text size="xs">
												ISBN: {book.isbn}
											</Text>
										</Flex>
									</Flex>
								</Flex>
							</Link>
						))}
					</Stack>
				</ModalContent>
			</Modal>

			{/* desktop view */}
			<Flex
				display={["none", "none", "flex", "flex"]}
				marginLeft="auto"
				alignItems="center"
			>
				<Flex justify="space-between" flex="1">
					<ButtonGroup variant="ghost" spacing="8">
						<IconButton
							aria-label="Search"
							onClick={() => setSearchIsOpen(true)}
						>
							<SearchIcon />
						</IconButton>
						{pages.map((page) => (
							<Link href={page.href} key={page.href}>
								<Button>{page.title}</Button>
							</Link>
						))}
					</ButtonGroup>
					<IconButton
						aria-label="Toggle dark mode"
						size="lg"
						icon={isDark ? <MoonIcon /> : <SunIcon />}
						onClick={toggleColorMode}
						as="a"
						variant="ghost"
					/>
				</Flex>
			</Flex>

			{/* mobile closed navbar */}
			<Flex
				display={["flex", "flex", "none", "none"]}
				marginLeft="auto"
				flexDir="row"
				alignItems="center"
			>
				<IconButton
					aria-label="Search"
					size="lg"
					as="a"
					variant="ghost"
					onClick={() => setSearchIsOpen(true)}
				>
					<SearchIcon />
				</IconButton>
				<IconButton
					aria-label="Open Menu"
					size="lg"
					icon={<HamburgerIcon />}
					onClick={() => setMobileIsOpen(true)}
					as="a"
					variant="ghost"
				/>
				<IconButton
					aria-label="Toggle dark mode"
					size="lg"
					icon={isDark ? <MoonIcon /> : <SunIcon />}
					onClick={toggleColorMode}
					as="a"
					variant="ghost"
				/>
			</Flex>

			{/* mobile open */}
			<Flex
				w="100vw"
				display={mobileIsOpen ? "flex" : "none"}
				padding="20px 10px 20px 10px"
				bgColor={useColorModeValue("white", "gray.800")}
				h="100vh"
				pos="fixed"
				top="0"
				left="0"
				zIndex={20}
				overflowY="auto"
				flexDir="column"
			>
				<Flex justify="flex-end">
					<IconButton
						mt={2}
						mr={2}
						aria-label="Close Menu"
						size="lg"
						icon={<CloseIcon />}
						onClick={() => setMobileIsOpen(false)}
						variant="ghost"
					/>
				</Flex>
				<Flex flexDir="column" align="center">
					{pages.map((page) => {
						return (
							<Link href={page.href} key={page.href}>
								<Button
									variant="ghost"
									my={5}
									onClick={() => setMobileIsOpen(false)}
								>
									{page.title}
								</Button>
							</Link>
						)
					})}
				</Flex>
			</Flex>
		</Flex>
	)
}

export default Navbar
