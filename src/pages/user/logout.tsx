import {
	Button,
	Center,
	Container,
	FormControl,
	FormErrorMessage,
	FormLabel,
	Heading,
	Input,
	Text,
} from "@chakra-ui/react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useFormik } from "formik"
import { LoginForm } from "@/utils/validators/UserForms"
import type { LoginFormType } from "@/utils/validators/UserForms"
import { toFormikValidationSchema } from "zod-formik-adapter"
import { useDebouncedCallback } from "use-debounce"
import { useAppDispatch, useAppSelector } from "@/utils/redux/hooks"
import { useRouter } from "next/router"
import { login, logout } from "@/utils/redux/parts/user"

export default function SignIn() {
	const dispatch = useAppDispatch()
	const { user } = useAppSelector((state) => state.user)
	const router = useRouter()
	useEffect(() => {
		const logoutUser = async () => {
			const res = await fetch("/api/user/logout", {
				method: "POST",
			})
			if (res.status === 200) {
				dispatch(logout())
			}
		}
		logoutUser()
	})
	useEffect(() => {
		if (!user) {
			router.push("/")
		}
	}, [user])

	if (user) {
		return (
			<Container maxW="60ch">
				<Center flexDir="column">
					<Heading m={5}>Logout</Heading>
					<Text>You will be logged out soon</Text>
				</Center>
			</Container>
		)
	}

	return (
		<Container maxW="60ch">
			<Center flexDir="column">
				<Heading m={5}>Logout</Heading>
				<Text>You have been logged out</Text>
				<Text>You will be redirected to the homepage soon</Text>
			</Center>
		</Container>
	)
}
